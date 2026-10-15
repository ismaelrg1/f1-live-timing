from fastapi import FastAPI
from f1_livetiming.config import settings
from f1_livetiming.replay.catalog import discover_replays, replay_to_json

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