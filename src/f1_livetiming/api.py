from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from f1_livetiming.config import settings
from f1_livetiming.replay.catalog import discover_replays, replay_to_json

from f1_livetiming.replay.catalog import find_replay
from f1_livetiming.replay.player import ReplayPlayer

app = FastAPI(
    title="F1 Live Timing",
    version="0.1.0",
)

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