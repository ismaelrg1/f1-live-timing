from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import websockets
from websockets.asyncio.server import serve

from replay_catalog import discover_replays, find_replay, replay_to_json
from websocket_server import DEFAULT_MAX_FPS, ReplayWebSocketServer


DEFAULT_WS_HOST = "0.0.0.0"
DEFAULT_WS_PORT = 8767
DEFAULT_HTTP_HOST = "127.0.0.1"
DEFAULT_HTTP_PORT = 8768


class ReplayService:
    def __init__(
        self,
        search_dirs: list[Path],
        speed: float,
        max_fps: float,
    ) -> None:
        self.search_dirs = search_dirs
        self.speed = speed
        self.max_fps = max_fps

    def list_replays(self) -> list[dict]:
        return [
            replay_to_json(entry)
            for entry in discover_replays(self.search_dirs)
        ]

    def find_replay(self, replay_id: str):
        return find_replay(self.search_dirs, replay_id)

    async def handle_websocket(self, websocket) -> None:
        request = getattr(websocket, "request", None)
        path = getattr(request, "path", "")

        query = parse_qs(urlparse(path).query)
        replay_id = query.get("replayId", [""])[0]

        if not replay_id:
            await websocket.send(json.dumps({
                "type": "error",
                "error": "missing replayId",
            }))
            await websocket.close()
            return

        replay = self.find_replay(replay_id)

        if replay is None:
            await websocket.send(json.dumps({
                "type": "error",
                "error": f"replay not found: {replay_id}",
            }))
            await websocket.close()
            return

        print(f"[replay-service] client replay={replay.id} parts={replay.parts}", flush=True)

        server = ReplayWebSocketServer(
            replay_path=replay.files,
            speed=self.speed,
            max_fps=self.max_fps,
            loop_replay=False,
        )

        try:
            await server.run_replay(websocket)
        except websockets.ConnectionClosedOK:
            print(f"[replay-service] client disconnected replay={replay.id}", flush=True)
        except websockets.ConnectionClosed:
            print(f"[replay-service] client connection closed replay={replay.id}", flush=True)


async def handle_http(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
    service: ReplayService,
) -> None:
    request = await reader.read(8192)
    text = request.decode("utf-8", errors="ignore")
    first_line = text.splitlines()[0] if text.splitlines() else ""

    parts = first_line.split()
    method = parts[0] if len(parts) >= 1 else ""
    path = urlparse(parts[1]).path if len(parts) >= 2 else ""

    status = "200 OK"

    if method == "GET" and path.endswith("/api/replays"):
        body = {
            "replays": service.list_replays(),
        }
    else:
        status = "404 Not Found"
        body = {
            "error": "not found",
        }

    payload = json.dumps(body, ensure_ascii=False, default=str).encode("utf-8")

    writer.write(
        (
            f"HTTP/1.1 {status}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(payload)}\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type\r\n"
            "\r\n"
        ).encode("utf-8") + payload
    )

    await writer.drain()
    writer.close()
    await writer.wait_closed()


async def main_async(args) -> None:
    search_dirs = [Path(path).expanduser().resolve() for path in args.search_dir]

    service = ReplayService(
        search_dirs=search_dirs,
        speed=args.speed,
        max_fps=args.max_fps,
    )

    http_server = await asyncio.start_server(
        lambda reader, writer: handle_http(reader, writer, service),
        args.http_host,
        args.http_port,
    )

    async with serve(service.handle_websocket, args.ws_host, args.ws_port):
        print(f"replay websocket on ws://{args.ws_host}:{args.ws_port}")
        print(f"replay http api on http://{args.http_host}:{args.http_port}")
        print("search dirs:")

        for path in search_dirs:
            print(f"  {path}")

        async with http_server:
            await http_server.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--search-dir",
        action="append",
        required=True,
        help="Directory with replay jsonl files. Can be passed multiple times.",
    )
    parser.add_argument("--ws-host", default=DEFAULT_WS_HOST)
    parser.add_argument("--ws-port", type=int, default=DEFAULT_WS_PORT)
    parser.add_argument("--http-host", default=DEFAULT_HTTP_HOST)
    parser.add_argument("--http-port", type=int, default=DEFAULT_HTTP_PORT)
    parser.add_argument("--speed", type=float, default=10.0)
    parser.add_argument("--max-fps", type=float, default=DEFAULT_MAX_FPS)

    args = parser.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()