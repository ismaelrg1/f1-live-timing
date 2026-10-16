import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from f1_livetiming.config import settings
from f1_livetiming.replay.catalog import discover_replays, replay_to_json

from f1_livetiming.replay.catalog import find_replay
from f1_livetiming.replay.player import ReplayPlayer
from f1_livetiming.live.manager import LiveManager
from f1_livetiming.live.scheduler import LiveScheduler


@asynccontextmanager
async def lifespan(_: FastAPI):
    scheduler_task: asyncio.Task[None] | None = None

    if settings.live_enabled and settings.scheduler_enabled:
        scheduler_task = asyncio.create_task(
            live_scheduler.run(),
            name="live-scheduler",
        )

    try:
        yield
    finally:
        if scheduler_task is not None:
            scheduler_task.cancel()

            with suppress(asyncio.CancelledError):
                await scheduler_task

        if live_manager.status().get("running"):
            await live_manager.stop("shutdown")


app = FastAPI(
    title="F1 Live Timing",
    version="0.1.0",
    lifespan=lifespan,
)

live_manager = LiveManager(settings.data_dir)
live_scheduler = LiveScheduler(
    manager=live_manager,
    data_dir=settings.data_dir,
    poll_seconds=settings.scheduler_poll_seconds,
    lead_seconds=settings.scheduler_lead_seconds,
    max_session_seconds=settings.scheduler_max_session_seconds,
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