from __future__ import annotations

from typing import Any

from .state_builder import RawLiveTimingState


F1_STATIC_BASE_URL = "https://livetiming.formula1.com/static/"


def map_team_radio(
    state: RawLiveTimingState,
    drivers: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    session_info = get_topic_dict(state, "SessionInfo")
    session_path = string_value(session_info.get("Path"))
    team_radio = get_topic_dict(state, "TeamRadio")
    captures = indexed_values(team_radio.get("Captures"))
    driver_by_number = drivers_by_racing_number(drivers)

    mapped = []

    for index, capture in enumerate(captures):
        capture = as_dict(capture)
        racing_number = string_value(capture.get("RacingNumber"))
        driver = driver_by_number.get(racing_number, {})
        path = string_value(capture.get("Path"))

        mapped.append({
            "id": f"{capture.get('Utc', '')}-{racing_number}-{index}",
            "utc": string_value(capture.get("Utc")),
            "racingNumber": racing_number,
            "driverTla": string_value(driver.get("tla")),
            "driverName": string_value(driver.get("driverName")),
            "teamColour": string_value(driver.get("teamColour")),
            "path": path,
            "url": media_url(session_path, path),
        })

    return mapped[::-1]


def drivers_by_racing_number(drivers: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        string_value(driver.get("racingNumber")): driver
        for driver in drivers
    }


def media_url(session_path: str, path: str) -> str:
    if not path:
        return ""

    if path.startswith("http"):
        return path

    return F1_STATIC_BASE_URL + session_path.strip("/") + "/" + path.lstrip("/")


def get_topic_dict(state: RawLiveTimingState, topic: str) -> dict[str, Any]:
    return as_dict(state.get_topic(topic, {}))


def indexed_values(value: Any) -> list[Any]:
    return [item for _, item in indexed_items(value)]


def indexed_items(value: Any) -> list[tuple[int, Any]]:
    if isinstance(value, list):
        return list(enumerate(value))

    if not isinstance(value, dict):
        return []

    items = []

    for key, item in value.items():
        if key == "_kf":
            continue

        try:
            numeric_key = int(key)
        except ValueError:
            continue

        items.append((numeric_key, item))

    return sorted(items, key=lambda pair: pair[0])


def as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value

    return {}


def string_value(value: Any) -> str:
    if value is None:
        return ""

    return str(value)
