from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator, Sequence

@dataclass(frozen=True)
class ReplayEvent:
    line_number: int
    received_at: datetime | None
    kind: str
    topic: str
    data: Any
    raw: dict[str, Any]
    delay_from_previous: float


def parse_received_at(value: str | None) -> datetime | None:
    if not value:
        return None

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    
    return datetime.fromisoformat(value)

def extract_topic(raw: dict[str, Any]) -> str:
    return (
        raw.get("topic")
        or raw.get("Topic")
        or raw.get("stream")
        or raw.get("Stream")
        or "unknown"
    )


def extract_kind(raw: dict[str, Any]) -> str:
    return str(
        raw.get("kind")
        or raw.get("Kind")
        or raw.get("type")
        or raw.get("Type")
        or "update"
    )

def extract_data(raw: dict[str, Any]) -> Any:
    
    return(
        raw.get("data")
        if "data" in raw
        else raw.get("Data")
        if "Data" in raw
        else raw 
    )
    
def iter_replay_events(path: str | Path) -> Iterator[ReplayEvent]:
    path = Path(path)

    previous_received_at: datetime | None = None

    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            line = line.strip()

            if not line:
                continue

            raw = json.loads(line)

            received_at = parse_received_at(
                raw.get("received_at")
                or raw.get("receivedAt")
                or raw.get("timestamp")
                or raw.get("Timestamp")
            )

            delay_from_previous = 0.0

            if received_at is not None and previous_received_at is not None:
                delay_from_previous = max(
                    0.0,
                    (received_at - previous_received_at).total_seconds()
                )

            if received_at is not None:
                previous_received_at = received_at

            yield ReplayEvent(
                line_number=line_number,
                received_at=received_at,
                kind=extract_kind(raw),
                topic=extract_topic(raw),
                data=extract_data(raw),
                raw=raw,
                delay_from_previous=delay_from_previous,
            )


def iter_replay_events_many(paths: Sequence[str | Path]) -> Iterator[ReplayEvent]:
    previous_received_at: datetime | None = None
    global_line_number = 0

    for path in paths:
        path = Path(path)

        with path.open("r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()

                if not line:
                    continue

                raw = json.loads(line)
                global_line_number += 1

                received_at = parse_received_at(
                    raw.get("received_at")
                    or raw.get("receivedAt")
                    or raw.get("timestamp")
                    or raw.get("Timestamp")
                )

                delay_from_previous = 0.0

                if received_at is not None and previous_received_at is not None:
                    delay_from_previous = max(
                        0.0,
                        (received_at - previous_received_at).total_seconds()
                    )

                if received_at is not None:
                    previous_received_at = received_at

                yield ReplayEvent(
                    line_number=global_line_number,
                    received_at=received_at,
                    kind=extract_kind(raw),
                    topic=extract_topic(raw),
                    data=extract_data(raw),
                    raw=raw,
                    delay_from_previous=delay_from_previous,
                )


def inspect_replay(path: str | Path) -> None:
    events = list(iter_replay_events(path))

    topics: dict[str, int] = {}

    first_received_at = None
    last_received_at = None
    total_delay = 0.0
    delays_count = 0

    for event in events:
        topics[event.topic] = topics.get(event.topic, 0) + 1

        if event.received_at is not None:
            if first_received_at is None:
                first_received_at = event.received_at
            last_received_at = event.received_at

        if event.delay_from_previous > 0:
            total_delay += event.delay_from_previous
            delays_count += 1

    print(f"events: {len(events)}")
    print(f"first_received_at: {first_received_at}")
    print(f"last_received_at: {last_received_at}")

    if delays_count:
        print(f"avg_delay_seconds: {total_delay / delays_count:.3f}")

    print("topics:")

    for topic, count in sorted(topics.items(), key=lambda item: item[0]):
        print(f"  {topic}: {count}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("path")

    args = parser.parse_args()

    inspect_replay(args.path)
