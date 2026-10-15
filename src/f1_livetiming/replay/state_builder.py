from __future__ import annotations

import argparse
import copy
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .replay_render import ReplayEvent, iter_replay_events, iter_replay_events_many

JsonValue = dict[str, Any] | list[Any] | str | int | float | bool | None

@dataclass
class RawLiveTimingState:
    topics: dict[str, Any] = field(default_factory=dict)
    topic_updates: dict[str, int] = field(default_factory=dict)
    last_received_at: Any = None
    mini_sector_layout: list[int] | None = None

    def apply_event(self, event: ReplayEvent) -> None:
        if event.received_at is not None:
            self.last_received_at = event.received_at

        if event.topic == "Heartbeat":
            return

        is_snapshot = event.kind.lower() == "snapshot"
        current = self.topics.get(event.topic)

        if current is None or is_snapshot:
            self.topics[event.topic] = copy.deepcopy(event.data)
        else:
            self.topics[event.topic] = deep_merge(current, event.data)

        self.topic_updates[event.topic] = self.topic_updates.get(event.topic, 0) + 1

        if event.topic == "TimingData":
            self.mini_sector_layout = merge_mini_sector_layout(
                self.mini_sector_layout,
                infer_mini_sector_layout_from_timing_data(self.topics.get("TimingData")),
            )

    def get_topic(self, topic: str, default: Any = None) -> Any:
        return self.topics.get(topic, default)


def deep_merge(base: Any, patch: Any) -> Any:
    """
    Merge recursivo para updates parciales del live timing.

    Reglas:
    - dict + dict: merge recursivo por key
    - list: se reemplaza completa
    - valor simple: reemplaza el valor anterior
    """

    if isinstance(base, dict) and isinstance(patch, dict):
        for key, patch_value in patch.items():
            if key in base:
                base[key] = deep_merge(base[key], patch_value)
            else:
                base[key] = copy.deepcopy(patch_value)

        return base

    if isinstance(base, list) and isinstance(patch, dict):
        next_list = copy.deepcopy(base)

        for key, patch_value in patch.items():
            try:
                index = int(key)
            except (TypeError, ValueError):
                continue

            while len(next_list) <= index:
                next_list.append({})

            next_list[index] = deep_merge(next_list[index], patch_value)

        return next_list

    return copy.deepcopy(patch)


def build_state_from_replay(path: str | Path, limit: int | None = None) -> RawLiveTimingState:
    state = RawLiveTimingState()

    for index, event in enumerate(iter_replay_events(path), start=1):
        state.apply_event(event)

        if limit is not None and index >= limit:
            break

    return state


def infer_mini_sector_layout_from_replay(path: str | Path) -> list[int] | None:
    layout: list[int] | None = None

    for event in iter_replay_events(path):
        if event.topic != "TimingData":
            continue

        layout = merge_mini_sector_layout(
            layout,
            infer_mini_sector_layout_from_timing_data(event.data),
        )

    if layout is None or not any(layout):
        return None

    return layout

def infer_mini_sector_layout_from_replays(paths: list[str | Path]) -> list[int] | None:
    layout: list[int] | None = None

    for event in iter_replay_events_many(paths):
        if event.topic != "TimingData":
            continue

        layout = merge_mini_sector_layout(
            layout,
            infer_mini_sector_layout_from_timing_data(event.data),
        )

    if layout is None or not any(layout):
        return None

    return layout


def infer_mini_sector_layout_from_timing_data(timing_data: Any) -> list[int] | None:
    if not isinstance(timing_data, dict):
        return None

    lines = timing_data.get("Lines", timing_data)

    if not isinstance(lines, dict):
        return None

    layout = [0, 0, 0]

    for line in lines.values():
        if not isinstance(line, dict):
            continue

        for sector_index, sector in indexed_items(line.get("Sectors")):

            if sector_index >= len(layout) or not isinstance(sector, dict):
                continue

            segments = sector.get("Segments")

            count = len(indexed_items(segments))

            layout[sector_index] = max(layout[sector_index], count)

    if not any(layout):
        return None

    return layout


def indexed_items(value: Any) -> list[tuple[int, Any]]:
    if isinstance(value, list):
        return list(enumerate(value))

    if not isinstance(value, dict):
        return []

    items: list[tuple[int, Any]] = []

    for key, item in value.items():
        if key == "_kf":
            continue

        try:
            numeric_key = int(key)
        except (TypeError, ValueError):
            continue

        items.append((numeric_key, item))

    return sorted(items, key=lambda pair: pair[0])


def merge_mini_sector_layout(
    current: list[int] | None,
    next_layout: list[int] | None
) -> list[int] | None:
    if next_layout is None:
        return current

    if current is None:
        current = [0, 0, 0]

    return [
        max(current[index] if index < len(current) else 0, next_layout[index])
        for index in range(len(next_layout))
    ]


def summarize_state(state: RawLiveTimingState) -> None:
    print("topics in state:")

    for topic in sorted(state.topics):
        value = state.topics[topic]
        updates = state.topic_updates.get(topic, 0)

        if isinstance(value, dict):
            size = len(value)
            kind = "dict"
        elif isinstance(value, list):
            size = len(value)
            kind = "list"
        else:
            size = "-"
            kind = type(value).__name__

        print(f"  {topic}: {kind}, size={size}, events={updates}")

    print()
    summarize_driver_list(state)
    summarize_timing_data(state)
    summarize_timing_app_data(state)
    summarize_weather_data(state)
    summarize_track_status(state)
    summarize_lap_count(state)


def summarize_driver_list(state: RawLiveTimingState) -> None:
    driver_list = state.get_topic("DriverList", {})

    if not isinstance(driver_list, dict):
        print("DriverList: not available")
        return

    drivers = driver_list

    print(f"DriverList drivers: {len(drivers)}")

    sample_items = list(drivers.items())[:5]

    for racing_number, driver in sample_items:
        if not isinstance(driver, dict):
            continue

        tla = driver.get("Tla") or driver.get("TLA") or "-"
        full_name = driver.get("FullName") or driver.get("BroadcastName") or "-"
        team = driver.get("TeamName") or "-"

        print(f"  #{racing_number} {tla} {full_name} - {team}")

    print()


def summarize_timing_data(state: RawLiveTimingState) -> None:
    timing_data = state.get_topic("TimingData", {})

    if not isinstance(timing_data, dict):
        print("TimingData: not available")
        return

    lines = timing_data.get("Lines", timing_data)

    if not isinstance(lines, dict):
        print("TimingData Lines: not available")
        return

    print(f"TimingData lines: {len(lines)}")

    sample_items = list(lines.items())[:5]

    for racing_number, line in sample_items:
        if not isinstance(line, dict):
            continue

        position = line.get("Position", "-")
        gap = line.get("GapToLeader", "-")
        interval = line.get("IntervalToPositionAhead", {})
        last_lap = line.get("LastLapTime", {})

        interval_value = (
            interval.get("Value")
            if isinstance(interval, dict)
            else interval
        )

        last_lap_value = (
            last_lap.get("Value")
            if isinstance(last_lap, dict)
            else last_lap
        )

        print(
            f"  #{racing_number} pos={position} "
            f"gap={gap} interval={interval_value} last={last_lap_value}"
        )

    print()


def summarize_timing_app_data(state: RawLiveTimingState) -> None:
    timing_app_data = state.get_topic("TimingAppData", {})

    if not isinstance(timing_app_data, dict):
        print("TimingAppData: not available")
        return

    lines = timing_app_data.get("Lines", timing_app_data)

    if not isinstance(lines, dict):
        print("TimingAppData Lines: not available")
        return

    print(f"TimingAppData lines: {len(lines)}")

    sample_items = list(lines.items())[:5]

    for racing_number, line in sample_items:
        if not isinstance(line, dict):
            continue

        stints = line.get("Stints", {})
        grid_pos = line.get("GridPos", "-")
        in_pit = line.get("InPit", False)
        pit_out = line.get("PitOut", False)

        latest_stint = latest_indexed_value(stints)

        compound = "-"
        total_laps = "-"

        if isinstance(latest_stint, dict):
            compound = latest_stint.get("Compound", "-")
            total_laps = latest_stint.get("TotalLaps", "-")

        print(
            f"  #{racing_number} grid={grid_pos} "
            f"compound={compound} tyre_laps={total_laps} "
            f"in_pit={in_pit} pit_out={pit_out}"
        )

    print()


def summarize_weather_data(state: RawLiveTimingState) -> None:
    weather = state.get_topic("WeatherData", {})

    if not isinstance(weather, dict):
        print("WeatherData: not available")
        return

    print("WeatherData:")
    print(f"  AirTemp: {weather.get('AirTemp', '-')}")
    print(f"  TrackTemp: {weather.get('TrackTemp', '-')}")
    print(f"  Humidity: {weather.get('Humidity', '-')}")
    print(f"  Pressure: {weather.get('Pressure', '-')}")
    print(f"  Rainfall: {weather.get('Rainfall', '-')}")
    print(f"  WindSpeed: {weather.get('WindSpeed', '-')}")
    print()


def summarize_track_status(state: RawLiveTimingState) -> None:
    track_status = state.get_topic("TrackStatus", {})

    if not isinstance(track_status, dict):
        print("TrackStatus: not available")
        return

    print("TrackStatus:")
    print(f"  Status: {track_status.get('Status', '-')}")
    print(f"  Message: {track_status.get('Message', '-')}")
    print()


def summarize_lap_count(state: RawLiveTimingState) -> None:
    lap_count = state.get_topic("LapCount", {})

    if not isinstance(lap_count, dict):
        print("LapCount: not available")
        return

    print("LapCount:")
    print(f"  CurrentLap: {lap_count.get('CurrentLap', '-')}")
    print(f"  TotalLaps: {lap_count.get('TotalLaps', '-')}")
    print()


def latest_indexed_value(value: Any) -> Any:
    """
    En muchos topics de F1 Live Timing, estructuras como Stints vienen como:
      {"0": {...}, "1": {...}, "2": {...}}

    Esta funcion devuelve el elemento con indice numerico mas alto.
    """

    if not isinstance(value, dict) or not value:
        return None

    numeric_keys = []

    for key in value:
        try:
            numeric_keys.append(int(key))
        except ValueError:
            continue

    if not numeric_keys:
        return None

    latest_key = str(max(numeric_keys))

    return value.get(latest_key)


def dump_topic(state: RawLiveTimingState, topic: str) -> None:
    value = state.get_topic(topic)

    if value is None:
        print(f"{topic}: not available")
        return

    print(json.dumps(value, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dump-topic", default=None)

    args = parser.parse_args()

    state = build_state_from_replay(args.path, limit=args.limit)

    if args.dump_topic:
        dump_topic(state, args.dump_topic)
    else:
        summarize_state(state)


if __name__ == "__main__":
    main()
