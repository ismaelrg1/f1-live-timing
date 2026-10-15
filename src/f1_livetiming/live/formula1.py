from typing import Any

try:
    from fastf1._api import parse as fastf1_parse
except Exception:  # pragma: no cover - only used when FastF1 internals move
    fastf1_parse = None


CONNECTION_URL = "wss://livetiming.formula1.com/signalrcore"
NEGOTIATE_URL = "https://livetiming.formula1.com/signalrcore/negotiate"

TOPICS = [
    "Heartbeat",
    "AudioStreams",
    "DriverList",
    "ExtrapolatedClock",
    "RaceControlMessages",
    "SessionInfo",
    "SessionStatus",
    "TeamRadio",
    "TimingAppData",
    "TimingStats",
    "TrackStatus",
    "WeatherData",
    "Position.z",
    "CarData.z",
    "ContentStreams",
    "SessionData",
    "TimingData",
    "TopThree",
    "RcmSeries",
    "LapCount",
]

def decode_payload(topic: str, payload: Any) -> tuple[Any, bool, str | None]:
    if not topic.endswith(".z") or not isinstance(payload, str):
        return payload, False, None

    if fastf1_parse is None:
        return payload, True, "FastF1 decoder is not available"

    try:
        return fastf1_parse(payload, zipped=True), True, None
    except Exception as exc:
        return payload, True, str(exc)