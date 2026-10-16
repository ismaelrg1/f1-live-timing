from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import WebSocket

from .runner import LiveTimingRunner


class LiveManager:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.raw_dir = data_dir / "raw"
        self.runner: LiveTimingRunner | None = None
        self.clients: set[WebSocket] = set()
        self.loop: asyncio.AbstractEventLoop | None = None
        self.lock = asyncio.Lock()

    def status(self) -> dict[str, Any]:
        if self.runner is None:
            return {
                "running": False,
                "hasState": False,
                "output": None,
            }

        return self.runner.status()

    async def start(
        self,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        async with self.lock:
            if self.runner is not None and self.runner.running:
                return self.runner.status()

            self.loop = asyncio.get_running_loop()
            self.raw_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%SZ")
            output_path = self.raw_dir / f"live_{timestamp}.jsonl"

            self.runner = LiveTimingRunner(
                output_path,
                metadata=metadata,
                on_message=self.publish_from_runner,
            )

            await asyncio.to_thread(self.runner.start)
            return self.runner.status()

    async def stop(self, reason: str = "manual") -> dict[str, Any]:
        async with self.lock:
            if self.runner is not None and self.runner.running:
                await asyncio.to_thread(self.runner.stop, reason)

            return self.status()

    async def add_client(self, websocket: WebSocket) -> None:
        self.clients.add(websocket)

        await websocket.send_json({
            "type": "live_status",
            **self.status(),
        })

        if self.runner is not None and self.runner.last_dashboard_message is not None:
            await websocket.send_json(self.runner.last_dashboard_message)

    def remove_client(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)

    def publish_from_runner(self, message: dict[str, Any]) -> None:
        if self.loop is None:
            return

        asyncio.run_coroutine_threadsafe(
            self.broadcast(message),
            self.loop,
        )

    async def broadcast(self, message: dict[str, Any]) -> None:
        disconnected: list[WebSocket] = []

        for websocket in list(self.clients):
            try:
                await websocket.send_json(message)
            except RuntimeError:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.clients.discard(websocket)