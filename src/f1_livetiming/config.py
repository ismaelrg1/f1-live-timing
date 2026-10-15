import os
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class Settings:
    """Application settings."""

    data_dir: Path
    live_enabled: bool

def env_bool(name: str, default: bool) -> bool:

    value = os.getenv(name)

    if value is None:
        return default

    return value.lower() in ("1", "true", "yes")

settings = Settings(
    data_dir=Path(os.getenv("F1_DATA_DIR", "data/livetiming")),
    live_enabled=env_bool("F1_LIVE_ENABLED", True),
)