from __future__ import annotations

import asyncio
import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from f1_livetiming.replay.replay_render import ReplayEvent, parse_received_at
from f1_livetiming.replay.state_builder import RawLiveTimingState
from f1_livetiming.replay.dashboard_mapper import map_dashboard_state

from .jsonl_writer import JsonlWriter
from .signalr_client import SignalRClient

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

class LiveTimingRunner:
    def __init__(
            self, 
            output_path: str | Path, 
            metadata: dict[str, Any] | None = None, 
            stop_delay_seconds: int = 120,
            on_message: Callable[[dict[str, Any]], None] | None = None,
        ):
        self.output_path = Path(output_path)
        self.metadata = metadata or {}
        self.stop_delay_seconds = stop_delay_seconds
        self.on_message = on_message

        self.writer = JsonlWriter(self.output_path)
        self.state = RawLiveTimingState()
        self.signalr: SignalRClient | None = None

        self.running = False
        self.event_count = 0
        self.last_dashboard_message: dict[str, Any] | None = None

        self.started_at: str | None = None
        self.stopped_at: str | None = None
        self.stop_reason: str | None = None

        self.last_message_at: str | None = None
        self.last_heartbeat_at: str | None = None

        self.session_end_detected = False
        self.session_end_detected_at: str | None = None
        self.stop_timer: threading.Timer | None = None

    def start(self) -> None:
        if self.running:
            return

        self.running = True
        self.started_at = utc_now()
        self.stopped_at = None
        self.stop_reason = None

        self.signalr = SignalRClient(on_event=self.handle_signalr_event)
        self.signalr.start()

    def stop(self, reason: str = "manual") -> None:
        if not self.running:
           return

        if self.stop_timer is not None:
           self.stop_timer.cancel()
           self.stop_timer = None

        if self.signalr is not None:
            self.signalr.stop()
            self.signalr = None

        self.writer.close()
        self.running = False
        self.stopped_at = utc_now()
        self.stop_reason = reason

        self.publish({
            "type": "live_status",
            "running": False,
            "hasState": self.last_dashboard_message is not None,
            "output": str(self.output_path),
            "reason": reason,
        })


    def handle_signalr_event(self, record: dict[str, Any]) -> None:
        self.writer.write(record)
        self.event_count += 1

        self.last_message_at = record.get("received_at") or utc_now()

        topic = str(record.get("topic", "unknown"))
        data = record.get("data")

        if topic == "Heartbeat":
            self.last_heartbeat_at = self.last_message_at

        self.detect_session_end(topic, data)

        event = ReplayEvent(
            line_number=self.event_count,
            received_at=parse_received_at(record.get("received_at")),
            kind=str(record.get("kind", "update")),
            topic=topic,
            data=data,
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

        self.last_dashboard_message = message
        self.publish(message)

    def detect_session_end(self, topic: str, data: Any) -> None:
        if self.session_end_detected:
            return

        if not isinstance(data, dict):
            return

        ended = False

        if topic == "SessionStatus":
            ended = data.get("Status") == "Ends"

        if topic == "SessionData":
            status_series = data.get("StatusSeries")

            if isinstance(status_series, dict):
                ended = any(
                    isinstance(item, dict) and item.get("SessionStatus") == "Ends"
                    for item in status_series.values()
                )

        if not ended:
            return

        self.session_end_detected = True
        self.session_end_detected_at = utc_now()

        self.publish({
            "type": "live_status",
            "running": self.running,
            "hasState": self.last_dashboard_message is not None,
            "output": str(self.output_path),
            "sessionEndDetected": True,
            "sessionEndDetectedAt": self.session_end_detected_at,
            "stopDelaySeconds": self.stop_delay_seconds,
        })

        self.stop_timer = threading.Timer(
            self.stop_delay_seconds,
            lambda: self.stop("session_ended"),
        )
        self.stop_timer.daemon = True
        self.stop_timer.start()

    def dashboard_ready(self) -> bool:
        return (
            self.state.get_topic("DriverList") is not None
            and self.state.get_topic("TimingData") is not None
            and self.state.get_topic("SessionInfo") is not None
        )

    def status(self) -> dict[str, Any]:
       return {
           "running": self.running,
           "hasState": self.last_dashboard_message is not None,
           "output": str(self.output_path),
           "metadata": self.metadata,
           "eventCount": self.event_count,
           "startedAt": self.started_at,
           "stoppedAt": self.stopped_at,
           "stopReason": self.stop_reason,
           "lastMessageAt": self.last_message_at,
           "lastHeartbeatAt": self.last_heartbeat_at,
           "sessionEndDetected": self.session_end_detected,
           "sessionEndDetectedAt": self.session_end_detected_at,
       }

    def publish(self, message: dict[str, Any]) -> None:
        if self.on_message is not None:
            self.on_message(message)