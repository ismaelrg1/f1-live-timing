from __future__ import annotations

import re
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PART_PATTERN = re.compile(r"^(?P<base>.+)_part(?P<part>\d+)\.jsonl$")


@dataclass(frozen=True)
class ReplayEntry:
    id: str
    label: str
    files: list[Path]
    parts: int
    year: str | None = None
    event_name: str | None = None
    session_name: str | None = None


def discover_replays(search_dirs: list[Path]) -> list[ReplayEntry]:
    grouped: dict[str, list[tuple[int, Path]]] = {}

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue

        for path in sorted(search_dir.glob("*.jsonl")):
            match = PART_PATTERN.match(path.name)

            if match:
                replay_id = match.group("base")
                part = int(match.group("part"))
            else:
                replay_id = path.stem
                part = 1

            grouped.setdefault(replay_id, []).append((part, path))

    entries: list[ReplayEntry] = []

    for replay_id, parts in grouped.items():
        ordered_files = [path for _, path in sorted(parts, key=lambda item: item[0])]

        info = session_info_from_files(ordered_files)

        entries.append(ReplayEntry(
            id=replay_id,
            label=pretty_label(
                info["year"],
                info["event_name"],
                info["session_name"],
                replay_id,
            ),
            files=ordered_files,
            parts=len(ordered_files),
            year=info["year"],
            event_name=info["event_name"],
            session_name=info["session_name"],
        ))

    return sorted(entries, key=lambda entry: entry.id, reverse=True)


def label_from_replay_id(replay_id: str, parts: int) -> str:
    match = re.match(
        r"^(?P<year>\d{4})-\d{2}-\d{2}_\d{4}Z_(?P<event>.+)_(?P<session>race|sprint|sprint_qualifying|qualifying|practice_1|practice_2|practice_3)$",
        replay_id,
    )

    if not match:
        return title_words(replay_id.replace("_", " "))

    year = match.group("year")
    event_name = title_words(match.group("event").replace("_", " "))
    session_name = format_session_name(match.group("session"))

    return f"{year} · {event_name} · {session_name}"

def title_words(value: str) -> str:
    return " ".join(word.capitalize() for word in value.split())

def format_session_name(value: str) -> str:
    labels = {
        "race": "Race",
        "sprint": "Sprint",
        "sprint_qualifying": "Sprint Qualifying",
        "qualifying": "Qualifying",
        "practice_1": "Practice 1",
        "practice_2": "Practice 2",
        "practice_3": "Practice 3",
    }

    return labels.get(value, title_words(value.replace("_", " ")))

def replay_to_json(entry: ReplayEntry) -> dict[str, Any]:
    return {
        "id": entry.id,
        "label": entry.label,
        "parts": entry.parts,
        "year": entry.year,
        "eventName": entry.event_name,
        "sessionName": entry.session_name,
    }


def find_replay(search_dirs: list[Path], replay_id: str) -> ReplayEntry | None:
    for entry in discover_replays(search_dirs):
        if entry.id == replay_id:
            return entry

    return None


def session_info_from_files(files: list[Path]) -> dict[str, str | None]:
    for path in files:
        with path.open("r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue

                try:
                    raw = json.loads(line)
                except json.JSONDecodeError:
                    continue

                topic = raw.get("topic") or raw.get("Topic")
                if topic != "SessionInfo":
                    continue

                data = raw.get("data") if "data" in raw else raw.get("Data", {})
                if not isinstance(data, dict):
                    continue

                meeting = data.get("Meeting", {})
                if not isinstance(meeting, dict):
                    meeting = {}

                start_date = str(data.get("StartDate") or "")
                year = start_date[:4] if len(start_date) >= 4 else None

                return {
                    "year": year,
                    "event_name": meeting.get("Name"),
                    "session_name": data.get("Name") or data.get("Type"),
                }

    return {
        "year": None,
        "event_name": None,
        "session_name": None,
    }


def pretty_label(year: str | None, event_name: str | None, session_name: str | None, replay_id: str) -> str:
    if year and event_name and session_name:
        return f"{year} · {event_name} · {session_name}"

    return title_words(replay_id.replace("_", " "))