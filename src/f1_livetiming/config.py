import os
from dataclasses import dataclass
from pathlib import Path



@dataclass(frozen=True)
class Settings:
    """Application settings."""

    data_dir: Path
    live_enabled: bool
    scheduler_enabled: bool
    scheduler_poll_seconds: int
    scheduler_lead_seconds: int
    scheduler_max_session_seconds: int

def env_bool(name: str, default: bool) -> bool:

    value = os.getenv(name)

    if value is None:
        return default

    return value.lower() in ("1", "true", "yes")

settings = Settings(
    data_dir=Path(os.getenv("F1_DATA_DIR", "data/livetiming")),
    live_enabled=env_bool("F1_LIVE_ENABLED", True),
    scheduler_enabled=env_bool("F1_SCHEDULER_ENABLED", False),
    scheduler_poll_seconds=int(os.getenv("F1_SCHEDULER_POLL_SECONDS", "30")),
    scheduler_lead_seconds=int(os.getenv("F1_SCHEDULER_LEAD_SECONDS", "300")),
    scheduler_max_session_seconds=int(
        os.getenv("F1_SCHEDULER_MAX_SESSION_SECONDS", "21600")
    ),
)