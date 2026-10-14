from __future__ import annotations

import argparse
import asyncio
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import websockets

from dashboard_mapper import map_dashboard_state
from replay_render import ReplayEvent, iter_replay_events, iter_replay_events_many
from state_builder import RawLiveTimingState, infer_mini_sector_layout_from_replay, infer_mini_sector_layout_from_replays


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
DEFAULT_MAX_FPS = 10.0


@dataclass
class PlaybackState:
    index: int = 0
    speed: float = 10.0
    paused: bool = False
    seek_index: int | None = None


@dataclass(frozen=True)
class ReplayMarker:
    index: int
    progress: float
    label: str
    status: str
    kind: str
    end_index: int | None = None
    end_progress: float | None = None


class ReplayWebSocketServer:
    def __init__(
        self,
        replay_path: str | Path | Sequence[str | Path],
        speed: float,
        max_fps: float,
        loop_replay: bool,
    ) -> None:
        self.replay_paths = resolve_replay_paths(replay_path)
        self.replay_path = self.replay_paths[0]
        self.speed = speed
        self.max_fps = max_fps
        self.loop_replay = loop_replay

        self.mini_sector_layout = infer_mini_sector_layout_from_replays(self.replay_paths)
        self.events = list(iter_replay_events_many(self.replay_paths))
        self.markers = replay_markers(self.events)

    async def handle_client(self, websocket) -> None:
        print(f"client connected: {websocket.remote_address}")

        try:
            await self.run_replay(websocket)
        except websockets.ConnectionClosed:
            print(f"client disconnected: {websocket.remote_address}")

    async def run_replay(self, websocket) -> None:
        playback = PlaybackState(speed=self.speed)
        controls_task = asyncio.create_task(self.receive_controls(websocket, playback))

        await websocket.send(json.dumps({
            "type": "replay_started",
            "path": str(self.replay_path),
            "paths": [str(path) for path in self.replay_paths],
            "totalEvents": len(self.events),
            "speed": playback.speed,
            "paused": playback.paused,
            "markers": [marker.__dict__ for marker in self.markers],
        }))

        while True:
            state = RawLiveTimingState(mini_sector_layout=self.mini_sector_layout)
            last_sent_at = 0.0

            async for message in self.iter_dashboard_messages(state, playback):
                now = time.monotonic()

                min_interval = 1.0 / self.max_fps if self.max_fps > 0 else 0.0
                if min_interval > 0 and now - last_sent_at < min_interval:
                    continue

                await websocket.send(message)
                last_sent_at = now

            await websocket.send(json.dumps({
                "type": "replay_finished",
                "path": str(self.replay_path),
                "paths": [str(path) for path in self.replay_paths],
            }))

            if not self.loop_replay:
                break

        controls_task.cancel()

    async def receive_controls(self, websocket, playback: PlaybackState) -> None:
        async for raw_message in websocket:
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue

            if message.get("type") != "replay_control":
                continue

            action = message.get("action")

            if action == "play":
                playback.paused = False
            elif action == "pause":
                playback.paused = True
            elif action == "toggle":
                playback.paused = not playback.paused
            elif action == "set_speed":
                playback.speed = clamp_float(message.get("speed"), minimum=0.1, maximum=200.0)
            elif action == "seek":
                progress = clamp_float(message.get("progress"), minimum=0.0, maximum=1.0)
                playback.seek_index = int(progress * max(0, len(self.events) - 1))

    async def iter_dashboard_messages(self, state: RawLiveTimingState, playback: PlaybackState):
        while playback.index < len(self.events):
            if playback.seek_index is not None:
                playback.index = playback.seek_index
                playback.seek_index = None
                state = self.build_state_until(playback.index)

                if is_dashboard_ready(state):
                    event = self.reference_event(playback.index)

                    yield self.dashboard_message(
                        state=state,
                        event=event,
                        index=playback.index,
                        topic="ReplaySeek",
                        speed=playback.speed,
                        paused=playback.paused,
                    )

            if playback.paused:
                await asyncio.sleep(0.05)
                continue

            event = self.events[playback.index]
            playback.index += 1
            state.apply_event(event)

            if playback.speed > 0 and event.delay_from_previous > 0:
                await asyncio.sleep(event.delay_from_previous / playback.speed)

            if event.topic == "Heartbeat" or not is_dashboard_ready(state):
                continue

            dashboard_state = map_dashboard_state(state)

            yield self.dashboard_message(
                state=state,
                event=event,
                index=playback.index,
                topic=event.topic,
                speed=playback.speed,
                paused=playback.paused,
            )

    def build_state_until(self, target_index: int) -> RawLiveTimingState:
        state = RawLiveTimingState(mini_sector_layout=self.mini_sector_layout)

        for event in self.events[:target_index]:
            state.apply_event(event)

        return state

    def reference_event(self, index: int) -> ReplayEvent:
        safe_index = min(max(0, index - 1), len(self.events) - 1)

        return self.events[safe_index]

    def dashboard_message(
        self,
        state: RawLiveTimingState,
        event: ReplayEvent,
        index: int,
        topic: str,
        speed: float,
        paused: bool,
    ) -> str:
        dashboard_state = map_dashboard_state(state)

        return json.dumps({
            "type": "dashboard_state",
            "receivedAt": event.received_at.isoformat() if event.received_at else None,
            "topic": topic,
            "lineNumber": event.line_number,
            "currentIndex": index,
            "totalEvents": len(self.events),
            "progress": index / len(self.events) if self.events else 0,
            "speed": speed,
            "paused": paused,
            "payload": dashboard_state,
        })


def is_dashboard_ready(state: RawLiveTimingState) -> bool:
    return (
        state.get_topic("DriverList") is not None
        and state.get_topic("TimingData") is not None
        and state.get_topic("SessionInfo") is not None
    )


def resolve_replay_path(path: str | Path) -> Path:
    replay_path = Path(path).expanduser()

    if replay_path.exists():
        return replay_path

    repo_root = Path(__file__).resolve().parents[3]
    repo_relative_path = repo_root / replay_path

    if repo_relative_path.exists():
        return repo_relative_path

    raise FileNotFoundError(
        f"Replay file not found: {path}. Tried '{replay_path}' and '{repo_relative_path}'."
    )

def resolve_replay_paths(paths: str | Path | Sequence[str | Path]) -> list[Path]:
    if isinstance(paths, (str, Path)):
        return [resolve_replay_path(paths)]

    resolved = [resolve_replay_path(path) for path in paths]

    if not resolved:
        raise FileNotFoundError("No replay files provided")

    return resolved


def clamp_float(value, minimum: float, maximum: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return minimum

    return min(max(number, minimum), maximum)


def replay_markers(events: list[ReplayEvent]) -> list[ReplayMarker]:
    markers: list[ReplayMarker] = []
    markers.extend(session_status_markers(events))
    markers.extend(track_status_markers(events))
    return markers


def session_status_markers(events: list[ReplayEvent]) -> list[ReplayMarker]:
    markers: list[ReplayMarker] = []
    total = max(1, len(events) - 1)
    seen: set[tuple[int, str]] = set()

    for index, event in enumerate(events):
        if event.topic != "SessionStatus" or not isinstance(event.data, dict):
            continue

        status = str(event.data.get("Status", ""))

        if status not in {"Started", "Finished", "Ends", "Finalised", "Aborted"}:
            continue

        marker_key = (index, status)

        if marker_key in seen:
            continue

        seen.add(marker_key)
        markers.append(ReplayMarker(
            index=index,
            progress=index / total,
            label=marker_label(status),
            status=status,
            kind=marker_kind(status),
        ))

    return markers


def track_status_markers(events: list[ReplayEvent]) -> list[ReplayMarker]:
    markers: list[ReplayMarker] = []
    total = max(1, len(events) - 1)
    active: tuple[int, str, str, str] | None = None

    for index, event in enumerate(events):
        if event.topic != "TrackStatus" or not isinstance(event.data, dict):
            continue

        status = str(event.data.get("Status", ""))
        label, kind = track_status_marker(status)

        if kind is None:
            if active is not None:
                start_index, active_status, active_label, active_kind = active

                if index > start_index:
                    markers.append(ReplayMarker(
                        index=start_index,
                        progress=start_index / total,
                        label=active_label,
                        status=active_status,
                        kind=active_kind,
                        end_index=index,
                        end_progress=index / total,
                    ))

                active = None

            continue

        if active is not None:
            start_index, active_status, active_label, active_kind = active

            if active_kind == kind:
                continue

            if index > start_index:
                markers.append(ReplayMarker(
                    index=start_index,
                    progress=start_index / total,
                    label=active_label,
                    status=active_status,
                    kind=active_kind,
                    end_index=index,
                    end_progress=index / total,
                ))

        active = (index, status, label, kind)

    if active is not None:
        start_index, active_status, active_label, active_kind = active

        markers.append(ReplayMarker(
            index=start_index,
            progress=start_index / total,
            label=active_label,
            status=active_status,
            kind=active_kind,
            end_index=len(events) - 1,
            end_progress=1,
        ))

    return markers


def track_status_marker(status: str) -> tuple[str, str | None]:
    if status == "4":
        return "SC", "safety_car"

    if status in {"6", "7"}:
        return "VSC", "virtual_safety_car"

    if status == "5":
        return "RF", "red_flag"

    return "", None


def marker_kind(status: str) -> str:
    if status == "Started":
        return "start"

    if status == "Aborted":
        return "aborted"

    return "end"


def marker_label(status: str) -> str:
    if status == "Started":
        return "START"

    if status == "Aborted":
        return "ABORT"

    return "END"


async def serve(
    replay_path: str | Path | Sequence[str | Path],
    host: str,
    port: int,
    speed: float,
    max_fps: float,
    loop_replay: bool,
) -> None:
    resolved_replay_paths = resolve_replay_paths(replay_path)
    server = ReplayWebSocketServer(
        replay_path=resolved_replay_paths,
        speed=speed,
        max_fps=max_fps,
        loop_replay=loop_replay,
    )

    async with websockets.serve(server.handle_client, host, port):
        print(f"replay websocket listening on ws://{host}:{port}")
        print("replay files:")
        for path in resolved_replay_paths:
            print(f"  {path}")
        print(f"speed: {speed}x")
        print(f"max_fps: {max_fps}")
        print(f"loop: {loop_replay}")
        print(f"events: {len(server.events)}")
        print(f"markers: {len(server.markers)}")

        await asyncio.Future()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("replay_path", nargs="+")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--speed", type=float, default=10.0)
    parser.add_argument("--max-fps", type=float, default=DEFAULT_MAX_FPS)
    parser.add_argument("--loop", action="store_true")

    args = parser.parse_args()

    asyncio.run(
        serve(
            replay_path=args.replay_path,
            host=args.host,
            port=args.port,
            speed=args.speed,
            max_fps=args.max_fps,
            loop_replay=args.loop,
        )
    )


if __name__ == "__main__":
    main()
