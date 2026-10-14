from __future__ import annotations

from typing import Any

from state_builder import RawLiveTimingState


def map_race_control_messages(
    state: RawLiveTimingState,
    drivers: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    race_control = get_topic_dict(state, "RaceControlMessages")
    messages = indexed_values(race_control.get("Messages"))
    driver_by_number = drivers_by_racing_number(drivers)

    mapped = []

    for index, message in enumerate(messages):
        message = as_dict(message)
        racing_number = string_value(message.get("RacingNumber"))
        driver = driver_by_number.get(racing_number, {})

        mapped.append({
            "id": f"{message.get('Utc', '')}-{index}",
            "utc": string_value(message.get("Utc")),
            "lap": to_int(message.get("Lap")),
            "category": string_value(message.get("Category")),
            "message": string_value(message.get("Message")),
            "status": string_value(message.get("Status")),
            "flag": string_value(message.get("Flag")),
            "scope": string_value(message.get("Scope")),
            "sector": to_int(message.get("Sector")),
            "racingNumber": racing_number,
            "driverTla": string_value(driver.get("tla")),
        })

    return mapped[::-1]


def drivers_by_racing_number(drivers: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        string_value(driver.get("racingNumber")): driver
        for driver in drivers
    }


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


def to_int(value: Any) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None
