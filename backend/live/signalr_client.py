from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Callable

import requests
from signalrcore.hub_connection_builder import HubConnectionBuilder
from signalrcore.messages.completion_message import CompletionMessage

from main import (
    CONNECTION_URL,
    NEGOTIATE_URL,
    TOPICS,
    decode_payload,
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class SignalRClient:
    def __init__(
        self,
        on_event: Callable[[dict[str, Any]], None],
        topics: list[str] | None = None,
        request_timeout: float = 15,
    ):
        self.on_event = on_event
        self.topics = topics or TOPICS
        self.request_timeout = request_timeout
        self.connection = None
        self.connected = False
        self.last_message_monotonic: float | None = None

    def negotiate_headers(self) -> dict[str, str]:
        response = requests.options(NEGOTIATE_URL, timeout=self.request_timeout)
        cookie = response.cookies.get("AWSALBCORS") or response.cookies.get("AWSALB")

        if not cookie:
            return {}

        return {"Cookie": f"AWSALBCORS={cookie}"}

    def emit_record(self, kind: str, topic: str, payload: Any, timestamp: Any = None) -> None:
        decoded, compressed, decode_error = decode_payload(topic, payload)

        record = {
            "source": "formula1_signalr",
            "kind": kind,
            "topic": topic,
            "timestamp": timestamp,
            "received_at": utc_now(),
            "compressed": compressed,
            "data": decoded,
        }

        if decode_error:
            record["decode_error"] = decode_error

        self.last_message_monotonic = time.monotonic()
        self.on_event(record)

    def on_completion(self, message: CompletionMessage) -> None:
        if message.error:
            print(f"[signalr] subscribe error: {message.error}", flush=True)
            return

        result = message.result or {}

        if not isinstance(result, dict):
            return

        for topic, payload in result.items():
            self.emit_record("snapshot", topic, payload, "")

    def on_feed(self, message: Any) -> None:
        if isinstance(message, list) and len(message) >= 2 and isinstance(message[0], str):
            topic = message[0]
            payload = message[1]
            timestamp = message[2] if len(message) > 2 else None
        else:
            topic = "feed"
            payload = message
            timestamp = None

        self.emit_record("update", topic, payload, timestamp)

    def start(self) -> None:
        headers = self.negotiate_headers()

        self.connection = (
            HubConnectionBuilder()
            .with_url(CONNECTION_URL, options={"verify_ssl": True, "headers": headers})
            .configure_logging(logging.WARNING)
            .build()
        )

        self.connection.on_open(lambda: print("[signalr] connected", flush=True))
        self.connection.on_close(lambda: print("[signalr] closed", flush=True))
        self.connection.on_error(lambda error: print(f"[signalr] error: {error}", flush=True))
        self.connection.on("feed", self.on_feed)
        self.connection.start()

        time.sleep(1)

        self.connection.send("Subscribe", [self.topics], on_invocation=self.on_completion)
        self.connected = True

    def stop(self) -> None:
        if self.connection is not None:
            self.connection.stop()

        self.connected = False