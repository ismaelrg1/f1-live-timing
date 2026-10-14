from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from state_builder import RawLiveTimingState

from race_control_mapper import map_race_control_messages
from team_radio_mapper import map_team_radio


UNKNOWN_COMPOUND = "UNKNOWN"
DEFAULT_SEGMENT_COUNTS = [8, 8, 8]

def map_dashboard_state(state: RawLiveTimingState) -> dict[str, Any]:
    drivers = map_drivers(state)

    return {
        "session": map_session(state),
        "drivers": drivers,
        "secondaryPanels": {
            "teamRadio": map_team_radio(state, drivers),
            "raceControlMessages": map_race_control_messages(state, drivers),
        },
    }


def map_session(state: RawLiveTimingState) -> dict[str, Any]:
    session_info = get_topic_dict(state, "SessionInfo")
    session_status = get_topic_dict(state, "SessionStatus")
    session_data = get_topic_dict(state, "SessionData")
    timing_data = get_topic_dict(state, "TimingData")
    extrapolated_clock = get_topic_dict(state, "ExtrapolatedClock")
    weather = get_topic_dict(state, "WeatherData")
    track_status = get_topic_dict(state, "TrackStatus")
    lap_count = get_topic_dict(state, "LapCount")

    current_lap = to_int(lap_count.get("CurrentLap"))
    total_laps = to_int(lap_count.get("TotalLaps"))

    remaining_laps = None
    if current_lap is not None and total_laps is not None:
        remaining_laps = max(0, total_laps - current_lap)

    session_type = session_info.get("Type", "")
    session_name = session_info.get("Name", "")
    session_status_value = string_value(session_status.get("Status"))
    clock_running = (
        session_status_value == "Started"
        and bool_value(extrapolated_clock.get("Extrapolating"))
    )
    clock_remaining = extrapolated_remaining(state, extrapolated_clock, clock_running)

    if session_status_value in {"Finished", "Finalised", "Ends"}:
        clock_remaining = "00:00:00"

    qualifying_part = (
        to_int(timing_data.get("SessionPart"))
        or latest_qualifying_part(session_data)
        or detect_qualifying_part(session_name)
    )
    qualifying_part_label = f"Q{qualifying_part}" if qualifying_part else None
    elimination_zone_start = elimination_zone_starts_at(
        qualifying_part,
        timing_data.get("NoEntries"),
    )

    return {
        "sessionKey": to_int(session_info.get("Key")),
        "meetingKey": to_int(session_info.get("Meeting", {}).get("Key"))
        if isinstance(session_info.get("Meeting"), dict)
        else None,
        "meetingName": session_info.get("Meeting", {}).get("Name", "")
        if isinstance(session_info.get("Meeting"), dict)
        else "",
        "circuitName": session_info.get("Meeting", {}).get("Circuit", {}).get("ShortName", "")
        if isinstance(session_info.get("Meeting"), dict)
        and isinstance(session_info.get("Meeting", {}).get("Circuit"), dict)
        else "",
        "countryCode": session_info.get("Meeting", {}).get("Country", {}).get("Code", "")
        if isinstance(session_info.get("Meeting"), dict)
        and isinstance(session_info.get("Meeting", {}).get("Country"), dict)
        else "",
        "sessionType": session_type,
        "sessionName": session_name,
        "sessionStatus": session_status_value,
        "archiveStatus": session_status.get("ArchiveStatus", ""),
        "startDate": session_info.get("StartDate", ""),
        "endDate": session_info.get("EndDate", ""),
        "gmtOffset": session_info.get("GmtOffset", ""),
        "clockUtc": string_value(extrapolated_clock.get("Utc")),
        "clockRemaining": clock_remaining,
        "clockRunning": clock_running,
        "currentLap": current_lap,
        "totalLaps": total_laps,
        "remainingLaps": remaining_laps,
        "qualifyingPart": qualifying_part,
        "qualifyingPartLabel": qualifying_part_label,
        "eliminationZoneStartsAt": elimination_zone_start,
        "miniSectorLayout": state.mini_sector_layout,
        "trackStatusCode": str(track_status.get("Status", "1")),
        "trackStatusMessage": track_status.get("Message", ""),
        "weather": {
            "airTemp": string_value(weather.get("AirTemp")),
            "trackTemp": string_value(weather.get("TrackTemp")),
            "humidity": string_value(weather.get("Humidity")),
            "pressure": string_value(weather.get("Pressure")),
            "rainfall": string_value(weather.get("Rainfall")),
            "windDirection": string_value(weather.get("WindDirection")),
            "windSpeed": string_value(weather.get("WindSpeed")),
        },
        "cutOffTime": "",
        "cutOffPercentage": "",
    }


def map_drivers(state: RawLiveTimingState) -> list[dict[str, Any]]:
    driver_list = get_topic_dict(state, "DriverList")
    timing_data = get_lines(state, "TimingData")
    timing_data_topic = get_topic_dict(state, "TimingData")
    timing_app_data = get_lines(state, "TimingAppData")
    timing_stats = get_lines(state, "TimingStats")
    segment_counts = state.mini_sector_layout or infer_segment_counts(timing_data)
    qualifying_part = to_int(timing_data_topic.get("SessionPart"))

    drivers: list[dict[str, Any]] = []

    for racing_number, driver_info in driver_list.items():
        if racing_number == "_kf":
            continue

        if not isinstance(driver_info, dict):
            continue

        timing_line = as_dict(timing_data.get(racing_number))
        app_line = as_dict(timing_app_data.get(racing_number))
        stats_line = as_dict(timing_stats.get(racing_number))

        driver = map_driver(
            racing_number=racing_number,
            driver_info=driver_info,
            timing_line=timing_line,
            app_line=app_line,
            stats_line=stats_line,
            segment_counts=segment_counts,
            qualifying_part=qualifying_part,
        )

        drivers.append(driver)

    drivers.sort(key=lambda driver: safe_position(driver["position"]))
    apply_qualifying_zone_flags(state, drivers)
    apply_best_lap_ranks(drivers)

    return drivers


def map_driver(
    racing_number: str,
    driver_info: dict[str, Any],
    timing_line: dict[str, Any],
    app_line: dict[str, Any],
    stats_line: dict[str, Any],
    segment_counts: list[int],
    qualifying_part: int | None,
) -> dict[str, Any]:
    position = string_value(timing_line.get("Position"))
    grid_position = to_int(app_line.get("GridPos"))
    position_int = to_int(position)

    grid_delta = None
    if grid_position is not None and position_int is not None:
        grid_delta = grid_position - position_int

    last_lap = as_dict(timing_line.get("LastLapTime"))
    best_lap = as_dict(timing_line.get("BestLapTime"))
    personal_best_lap = as_dict(stats_line.get("PersonalBestLapTime"))
    interval = as_dict(timing_line.get("IntervalToPositionAhead"))
    qualifying_stats = qualifying_stats_for_part(timing_line, qualifying_part)
    gap_to_leader = string_value(timing_line.get("GapToLeader"))
    interval_to_ahead = string_value(interval.get("Value"))

    if not gap_to_leader:
        gap_to_leader = string_value(
            timing_line.get("TimeDiffToFastest")
            or qualifying_stats.get("TimeDiffToFastest")
        )

    if not interval_to_ahead:
        interval_to_ahead = string_value(
            timing_line.get("TimeDiffToPositionAhead")
            or timing_line.get("TimeDifftoPositionAhead")
            or qualifying_stats.get("TimeDiffToPositionAhead")
            or qualifying_stats.get("TimeDifftoPositionAhead")
        )

    stints = normalize_stints(app_line.get("Stints"))
    latest_stint = stints[-1] if stints else {}

    compound = normalize_compound(latest_stint.get("compound"))
    tyre_laps = to_int(latest_stint.get("totalLaps")) or 0
    start_laps = to_int(latest_stint.get("startLaps")) or 0

    return {
        "position": position,
        "racingNumber": racing_number,
        "tla": driver_info.get("Tla", ""),
        "driverName": driver_info.get("FullName", ""),
        "broadcastName": driver_info.get("BroadcastName", ""),
        "team": driver_info.get("TeamName", ""),
        "teamColour": driver_info.get("TeamColour", ""),
        "gapToLeader": gap_to_leader,
        "intervalToAhead": interval_to_ahead,
        "catchingAhead": bool_value(interval.get("Catching")),
        "lastLap": string_value(last_lap.get("Value")),
        "lastLapPersonalBest": bool_value(last_lap.get("PersonalFastest")),
        "lastLapOverallBest": bool_value(last_lap.get("OverallFastest")),
        "bestLap": string_value(best_lap.get("Value")),
        "bestLapLap": to_int(best_lap.get("Lap")),
        "bestLapRank": to_int(best_lap.get("Position")) or to_int(personal_best_lap.get("Position")),
        "sectors": map_sectors(timing_line, segment_counts),
        "lastLapSectors": map_last_lap_sectors(timing_line, segment_counts),
        "bestSectors": map_best_sectors(stats_line),
        "laps": to_int(timing_line.get("NumberOfLaps")) or 0,
        "pitStops": to_int(timing_line.get("NumberOfPitStops")) or 0,
        "compound": compound,
        "tyreLaps": start_laps + tyre_laps,
        "stintLaps": tyre_laps,
        "isNewTyre": bool_value(latest_stint.get("new")),
        "tyresNotChanged": bool_value(latest_stint.get("tyresNotChanged")),
        "gridPosition": grid_position,
        "gridDelta": grid_delta,
        "retired": bool_value(timing_line.get("Retired")),
        "stopped": bool_value(timing_line.get("Stopped")),
        "inPit": bool_value(timing_line.get("InPit")) or bool_value(app_line.get("InPit")),
        "pitOut": bool_value(timing_line.get("PitOut")) or bool_value(app_line.get("PitOut")),
        "outlap": bool_value(timing_line.get("OutLap")),
        "stints": stints,
        "knockedOut": bool_value(timing_line.get("KnockedOut")),
        "cutoff": bool_value(timing_line.get("Cutoff")),
        "timeDiffToFastest": gap_to_leader,
        "timeDiffToPositionAhead": interval_to_ahead,
    }


def map_sectors(timing_line: dict[str, Any], segment_counts: list[int]) -> list[dict[str, Any]]:
    sectors_by_index = {
        index: as_dict(sector)
        for index, sector in indexed_items(timing_line.get("Sectors"))
    }

    sectors = []

    for index in range(3):
        sector = sectors_by_index.get(index, {})
        expected_segment_count = segment_counts[index] if index < len(segment_counts) else 0

        sectors.append({
            "index": index,
            "value": string_value(sector.get("Value")),
            "previousValue": string_value(sector.get("PreviousValue")),
            "personalFastest": bool_value(sector.get("PersonalFastest")),
            "overallFastest": bool_value(sector.get("OverallFastest")),
            "stopped": bool_value(sector.get("Stopped")),
            "segments": map_segments(sector.get("Segments"), expected_segment_count),
        })

    return sectors


def map_segments(value: Any, expected_count: int) -> list[dict[str, Any]]:
    segment_statuses: dict[int, int] = {}

    for index, segment in indexed_items(value):
        if isinstance(segment, int):
            status = segment
        else:
            segment = as_dict(segment)
            status = segment.get("Status")

        segment_statuses[index] = to_int(status) or 0

    segment_count = max(expected_count, max(segment_statuses.keys(), default=-1) + 1)
    segments = []

    for index in range(segment_count):
        segments.append({
            "index": index,
            "status": segment_statuses.get(index, 0),
        })

    return segments


def map_last_lap_sectors(timing_line: dict[str, Any], segment_counts: list[int]) -> list[dict[str, Any]]:
    sectors = map_sectors(timing_line, segment_counts)

    return [
        {
            "index": sector["index"],
            "value": sector["previousValue"] or sector["value"],
            "personalFastest": sector["personalFastest"],
            "overallFastest": sector["overallFastest"],
        }
        for sector in sectors
    ]


def map_best_sectors(stats_line: dict[str, Any]) -> list[dict[str, Any]]:
    sectors_raw = indexed_values(stats_line.get("BestSectors"))

    best_sectors = []

    for index, sector in enumerate(sectors_raw):
        sector = as_dict(sector)

        best_sectors.append({
            "index": index,
            "value": string_value(sector.get("Value")),
            "position": to_int(sector.get("Position")),
        })

    return best_sectors


def normalize_stints(value: Any) -> list[dict[str, Any]]:
    stints_raw = indexed_items(value)

    stints = []

    for index, stint in stints_raw:
        stint = as_dict(stint)

        compound = normalize_compound(stint.get("Compound"))

        stints.append({
            "index": index,
            "compound": compound,
            "new": bool_value(stint.get("New")),
            "tyresNotChanged": bool_value(stint.get("TyresNotChanged")),
            "totalLaps": to_int(stint.get("TotalLaps")) or 0,
            "startLaps": to_int(stint.get("StartLaps")) or 0,
            "lapTime": string_value(stint.get("LapTime")),
            "lapNumber": to_int(stint.get("LapNumber")),
            "lapFlags": to_int(stint.get("LapFlags")),
        })

    return stints


def qualifying_stats_for_part(
    timing_line: dict[str, Any],
    qualifying_part: int | None
) -> dict[str, Any]:
    stats = indexed_values(timing_line.get("Stats"))

    if not stats:
        return {}

    if qualifying_part is not None:
        index = qualifying_part - 1

        if 0 <= index < len(stats):
            return as_dict(stats[index])

    for stat in reversed(stats):
        stat = as_dict(stat)

        if stat.get("TimeDiffToFastest") or stat.get("TimeDifftoPositionAhead"):
            return stat

    return as_dict(stats[0])


def infer_segment_counts(timing_data: dict[str, Any]) -> list[int]:
    counts = [0, 0, 0]

    for line in timing_data.values():
        line = as_dict(line)

        for sector_index, sector in indexed_items(line.get("Sectors")):
            if sector_index >= len(counts):
                continue

            sector = as_dict(sector)
            segment_count = len(indexed_items(sector.get("Segments")))
            counts[sector_index] = max(counts[sector_index], segment_count)

    return [
        count if count > 0 else DEFAULT_SEGMENT_COUNTS[index]
        for index, count in enumerate(counts)
    ]


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


def get_topic_dict(state: RawLiveTimingState, topic: str) -> dict[str, Any]:
    return as_dict(state.get_topic(topic, {}))


def get_lines(state: RawLiveTimingState, topic: str) -> dict[str, Any]:
    topic_value = get_topic_dict(state, topic)

    lines = topic_value.get("Lines")

    if isinstance(lines, dict):
        return lines

    return topic_value


def as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value

    return {}


def string_value(value: Any) -> str:
    if value is None:
        return ""

    return str(value)


def extrapolated_remaining(
    state: RawLiveTimingState,
    extrapolated_clock: dict[str, Any],
    clock_running: bool
) -> str:
    remaining = string_value(extrapolated_clock.get("Remaining"))

    if not clock_running:
        return remaining

    clock_utc = parse_datetime(string_value(extrapolated_clock.get("Utc")))

    if clock_utc is None or state.last_received_at is None:
        return remaining

    remaining_seconds = parse_duration_seconds(remaining)

    if remaining_seconds is None:
        return remaining

    elapsed_seconds = max(0, int((state.last_received_at - clock_utc).total_seconds()))

    return format_duration(max(0, remaining_seconds - elapsed_seconds))


def parse_datetime(value: str) -> datetime | None:
    if not value:
        return None

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    if "." in value:
        prefix, suffix = value.split(".", 1)
        fraction = suffix
        timezone = ""

        for separator in ("+", "-"):
            if separator in suffix:
                fraction, timezone = suffix.split(separator, 1)
                timezone = separator + timezone
                break

        if len(fraction) > 6:
            value = f"{prefix}.{fraction[:6]}{timezone}"

    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def parse_duration_seconds(value: str) -> int | None:
    parts = value.split(":")

    if len(parts) != 3:
        return None

    try:
        hours, minutes, seconds = (int(part) for part in parts)
    except ValueError:
        return None

    return int(timedelta(hours=hours, minutes=minutes, seconds=seconds).total_seconds())


def format_duration(total_seconds: int) -> str:
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60

    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def to_int(value: Any) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def bool_value(value: Any) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, int):
        return value != 0

    if isinstance(value, str):
        return value.lower() in {"true", "1", "yes"}

    return False


def normalize_compound(value: Any) -> str:
    compound = string_value(value).upper()

    if compound in {"SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"}:
        return compound

    return UNKNOWN_COMPOUND


def safe_position(value: Any) -> int:
    position = to_int(value)

    if position is None:
        return 999

    return position


def detect_qualifying_part(session_name: str) -> int | None:
    upper_name = session_name.upper()

    if "Q1" in upper_name:
        return 1

    if "Q2" in upper_name:
        return 2

    if "Q3" in upper_name:
        return 3

    return None


def latest_qualifying_part(session_data: dict[str, Any]) -> int | None:
    series = as_dict(session_data.get("Series"))
    latest_part: int | None = None

    for item in indexed_values(series):
        item = as_dict(item)
        qualifying_part = to_int(item.get("QualifyingPart"))

        if qualifying_part is not None:
            latest_part = qualifying_part

    return latest_part


def apply_qualifying_zone_flags(state: RawLiveTimingState, drivers: list[dict[str, Any]]) -> None:
    timing_data = get_topic_dict(state, "TimingData")
    session_status = get_topic_dict(state, "SessionStatus")
    qualifying_part = to_int(timing_data.get("SessionPart")) or latest_qualifying_part(
        get_topic_dict(state, "SessionData")
    )
    elimination_start = elimination_zone_starts_at(qualifying_part, timing_data.get("NoEntries"))
    is_active = string_value(session_status.get("Status")) == "Started"

    if elimination_start is None:
        for driver in drivers:
            driver["cutoff"] = False
        return

    for driver in drivers:
        position = to_int(driver.get("position"))
        has_time = bool(driver.get("bestLap"))
        is_in_zone = position is not None and position >= elimination_start
        is_knocked_out = bool_value(driver.get("knockedOut"))

        driver["cutoff"] = is_active and has_time and is_in_zone and not is_knocked_out


def apply_best_lap_ranks(drivers: list[dict[str, Any]]) -> None:
    ranked_drivers = []

    for driver in drivers:
        seconds = lap_time_seconds(driver.get("bestLap"))

        if seconds is not None:
            ranked_drivers.append((seconds, safe_position(driver.get("position")), driver))

    ranked_drivers.sort(key=lambda item: (item[0], item[1]))

    for rank, (_, _, driver) in enumerate(ranked_drivers, start=1):
        driver["bestLapRank"] = rank


def lap_time_seconds(value: Any) -> float | None:
    text = string_value(value)

    if not text:
        return None

    parts = text.split(":")

    try:
        if len(parts) == 1:
            return float(parts[0])

        if len(parts) == 2:
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds

        if len(parts) == 3:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds
    except ValueError:
        return None

    return None


def elimination_zone_starts_at(
    qualifying_part: int | None,
    no_entries: Any = None
) -> int | None:
    entries = indexed_values(no_entries)

    if qualifying_part is not None and entries:
        next_part_index = qualifying_part

        if next_part_index < len(entries):
            next_part_entries = to_int(entries[next_part_index])

            if next_part_entries is not None:
                return next_part_entries + 1

    if qualifying_part == 1:
        return 16

    if qualifying_part == 2:
        return 11

    return None
