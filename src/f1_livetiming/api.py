from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from f1_livetiming.config import settings
from f1_livetiming.replay.catalog import discover_replays, replay_to_json

from f1_livetiming.replay.catalog import find_replay
from f1_livetiming.replay.player import ReplayPlayer
from f1_livetiming.live.manager import LiveManager

app = FastAPI(
    title="F1 Live Timing",
    version="0.1.0",
)

live_manager = LiveManager(settings.data_dir)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "liveEnabled": settings.live_enabled,
    }

@app.get("/api/v1/replays")
def list_replays():
    replays = discover_replays([settings.data_dir / "raw"])
    return {
        "replays": [replay_to_json(replay) for replay in replays],
    }

@app.websocket("/ws/replay")
async def replay_websocket(
    websocket: WebSocket,
    replayId: str,
):
    await websocket.accept()

    replay = find_replay(
        [settings.data_dir / "raw"],
        replayId,
    )

    if replay is None:
        await websocket.send_json({
            "type": "error",
            "error": "Replay not found",
        })
        await websocket.close(code=1008)
        return

    player = ReplayPlayer(
        replay.files,
        speed=10,
        max_fps=10,
        loop_replay=False,
    )

    try:
        await player.run_replay(websocket)
    except WebSocketDisconnect:
        pass

@app.get("/api/v1/live/status")
def live_status():
    return live_manager.status()


@app.post("/api/v1/live/start")
async def start_live():
    if not settings.live_enabled:
        return {
            "running": False,
            "error": "Live Timing is disabled",
        }

    return await live_manager.start()


@app.post("/api/v1/live/stop")
async def stop_live():
    return await live_manager.stop()


@app.websocket("/ws/live")
async def live_websocket(websocket: WebSocket):
    await websocket.accept()
    await live_manager.add_client(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        live_manager.remove_client(websocket)