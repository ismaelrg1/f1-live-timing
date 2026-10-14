from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import websockets
from websockets.asyncio.server import serve

from live_runner import LiveTimingRunner


runner: LiveTimingRunner | None = None


async def handle_websocket(websocket) -> None:
    global runner

    if runner is None:
        await websocket.send(json.dumps({
            "type": "live_status",
            "running": False,
        }))

        await websocket.wait_closed()
        return

    runner.add_client(websocket)

    try:
        await websocket.send(json.dumps({
            "type": "live_status",
            "running": runner.running,
            "output": str(runner.output_path),
        }))

        await websocket.wait_closed()
    finally:
        runner.remove_client(websocket)


async def handle_http(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
    global runner

    request = await reader.read(8192)
    text = request.decode("utf-8", errors="ignore")
    first_line = text.splitlines()[0] if text.splitlines() else ""

    status = "200 OK"
    body: dict = {}

    if first_line.startswith("POST /api/live/start"):
        if runner is None or not runner.running:
            output = Path("data/live/live_session.jsonl")
            runner = LiveTimingRunner(output)
            runner.loop = asyncio.get_running_loop()

            await asyncio.to_thread(runner.start)

        body = {
            "running": True,
            "output": str(runner.output_path),
        }

    elif first_line.startswith("POST /api/live/stop"):
        if runner is not None:
            await asyncio.to_thread(runner.stop)

        body = {"running": False}

    elif first_line.startswith("GET /api/live/status"):
        body = {
            "running": bool(runner and runner.running),
            "output": str(runner.output_path) if runner else None,
        }

    else:
        status = "404 Not Found"
        body = {"error": "not found"}

    payload = json.dumps(body).encode("utf-8")

    writer.write(
        f"HTTP/1.1 {status}\r\n"
        "Content-Type: application/json\r\n"
        f"Content-Length: {len(payload)}\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "\r\n"
    .encode("utf-8") + payload)

    await writer.drain()
    writer.close()
    await writer.wait_closed()


async def main() -> None:
    http_server = await asyncio.start_server(handle_http, "0.0.0.0", 8766)

    async with serve(handle_websocket, "0.0.0.0", 8765):
        print("live websocket on ws://0.0.0.0:8765")
        print("live http api on http://0.0.0.0:8766")

        async with http_server:
            await http_server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())