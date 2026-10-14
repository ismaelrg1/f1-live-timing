from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from replay_render import ReplayEvent, parse_received_at
from state_builder import RawLiveTimingState
from dashboard_mapper import map_dashboard_state

from jsonl_writer import JsonlWriter
from signalr_client import SignalRClient


class LiveTimingRunner:
    def __init__(self, output_path: str | Path):
        self.output_path = Path(output_path)
        self.writer = JsonlWriter(self.output_path)
        self.state = RawLiveTimingState()
        self.clients: set[Any] = set()
        self.signalr: SignalRClient | None = None
        self.running = False
        self.event_count = 0
        self.loop: asyncio.AbstractEventLoop | None = None

    def start(self) -> None:
        if self.running:
            return

        self.running = True
        self.signalr = SignalRClient(on_event=self.handle_signalr_event)
        self.signalr.start()

    def stop(self) -> None:
        if self.signalr is not None:
            self.signalr.stop()

        self.writer.close()
        self.running = False

    def add_client(self, websocket: Any) -> None:
        self.clients.add(websocket)

    def remove_client(self, websocket: Any) -> None:
        self.clients.discard(websocket)

    def handle_signalr_event(self, record: dict[str, Any]) -> None:
        self.writer.write(record)
        self.event_count += 1

        event = ReplayEvent(
            line_number=self.event_count,
            received_at=parse_received_at(record.get("received_at")),
            kind=str(record.get("kind", "update")),
            topic=str(record.get("topic", "unknown")),
            data=record.get("data"),
            raw=record,
            delay_from_previous=0.0,
        )

        self.state.apply_event(event)

        if not self.dashboard_ready():
            return

        message = {
            "type": "dashboard_state",
            "receivedAt": record.get("received_at"),
            "topic": event.topic,
            "lineNumber": self.event_count,
            "payload": map_dashboard_state(self.state),
        }

        self.broadcast(message)

    def dashboard_ready(self) -> bool:
        return (
            self.state.get_topic("DriverList") is not None
            and self.state.get_topic("TimingData") is not None
            and self.state.get_topic("SessionInfo") is not None
        )

    def broadcast(self, message: dict[str, Any]) -> None:
        if self.loop is None:
            return

        raw = json.dumps(message, ensure_ascii=False, default=str)

        for client in list(self.clients):
            asyncio.run_coroutine_threadsafe(client.send(raw), self.loop)