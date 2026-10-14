from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REPLAY_BACKEND_DIR = PROJECT_ROOT / "backend" / "replay"

sys.path.insert(0, str(REPLAY_BACKEND_DIR))

from dashboard_mapper import map_dashboard_state  # noqa: E402
from replay_render import ReplayEvent, iter_replay_events_many  # noqa: E402
from state_builder import RawLiveTimingState, infer_mini_sector_layout_from_replays  # noqa: E402
from websocket_server import is_dashboard_ready, replay_markers  # noqa: E402


DEFAULT_STATIC_DIR = PROJECT_ROOT / "dashboard" / "f1-dashboard" / "static"
DEFAULT_CATALOG_PATH = DEFAULT_STATIC_DIR / "replays" / "catalog.json"
DEFAULT_OUTPUT_DIR = DEFAULT_STATIC_DIR / "replays" / "generated"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG_PATH)
    parser.add_argument("--static-dir", type=Path, default=DEFAULT_STATIC_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--max-fps", type=float, default=10.0)
    parser.add_argument("--max-states", type=int, default=800)

    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for replay in catalog.get("replays", []):
        replay_id = replay["id"]
        raw_paths = [
            resolve_static_path(args.static_dir, part)
            for part in replay.get("parts", [])
        ]

        if not raw_paths:
            print(f"[static-export] skip {replay_id}: no parts")
            continue

        output_path = args.output_dir / f"{replay_id}.jsonl"
        export_replay(
            replay_id=replay_id,
            raw_paths=raw_paths,
            output_path=output_path,
            max_fps=args.max_fps,
            max_states=args.max_states,
        )

        print(f"[static-export] wrote {output_path}")


def resolve_static_path(static_dir: Path, value: str) -> Path:
    path = value.lstrip("/")
    return static_dir / path


def export_replay(
    replay_id: str,
    raw_paths: list[Path],
    output_path: Path,
    max_fps: float,
    max_states: int,
) -> None:
    events = list(iter_replay_events_many(raw_paths))
    mini_sector_layout = infer_mini_sector_layout_from_replays(raw_paths)
    markers = replay_markers(events)
    state = RawLiveTimingState(mini_sector_layout=mini_sector_layout)
    min_interval = 1.0 / max_fps if max_fps > 0 else 0.0
    last_exported_at: datetime | None = None
    state_step = max(1, len(events) // max(1, max_states))
    first_dashboard_state_exported = False

    with output_path.open("w", encoding="utf-8") as file:
        write_jsonl(file, {
            "type": "replay_started",
            "path": replay_id,
            "paths": [path.name for path in raw_paths],
            "totalEvents": len(events),
            "speed": 10,
            "paused": False,
            "markers": [marker.__dict__ for marker in markers],
        })

        for index, event in enumerate(events, start=1):
            state.apply_event(event)

            if event.topic == "Heartbeat" or not is_dashboard_ready(state):
                continue

            should_export_by_step = index % state_step == 0

            if not first_dashboard_state_exported:
                should_export_by_step = True

            if not should_export_by_step:
                continue

            if should_skip_event(event, last_exported_at, min_interval):
                continue

            if event.received_at is not None:
                last_exported_at = event.received_at

            first_dashboard_state_exported = True

            write_jsonl(file, dashboard_message(
                state=state,
                event=event,
                index=index,
                total_events=len(events),
            ))

        write_jsonl(file, {
            "type": "replay_finished",
            "path": replay_id,
            "paths": [path.name for path in raw_paths],
        })


def should_skip_event(
    event: ReplayEvent,
    last_exported_at: datetime | None,
    min_interval: float,
) -> bool:
    if min_interval <= 0 or event.received_at is None or last_exported_at is None:
        return False

    return (event.received_at - last_exported_at).total_seconds() < min_interval


def dashboard_message(
    state: RawLiveTimingState,
    event: ReplayEvent,
    index: int,
    total_events: int,
) -> dict[str, Any]:
    return {
        "type": "dashboard_state",
        "receivedAt": event.received_at.isoformat() if event.received_at else None,
        "topic": event.topic,
        "lineNumber": event.line_number,
        "currentIndex": index,
        "totalEvents": total_events,
        "progress": index / total_events if total_events else 0,
        "speed": 10,
        "paused": False,
        "payload": map_dashboard_state(state),
    }


def write_jsonl(file, value: dict[str, Any]) -> None:
    file.write(json.dumps(value, ensure_ascii=False, default=str))
    file.write("\n")


if __name__ == "__main__":
    main()
