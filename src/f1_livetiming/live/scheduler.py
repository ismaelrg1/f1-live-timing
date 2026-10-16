from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import fastf1
import pandas as pd

from .manager import LiveManager


@dataclass(frozen=True)
class ScheduledSession:
    session_id: str
    event_name: str
    session_name: str
    scheduled_start: datetime
    year: int
    round_number: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_utc_datetime(value: Any) -> datetime | None:
    if value is None or pd.isna(value):
        return None

    parsed = pd.Timestamp(value).to_pydatetime()

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def format_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"completedSessionIds": []}

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"completedSessionIds": []}


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(state, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def completed_ids(state: dict[str, Any]) -> set[str]:
    values = state.get("completedSessionIds", [])
    return set(values if isinstance(values, list) else [])


def mark_completed(path: Path, state: dict[str, Any], session_id: str) -> None:
    ids = completed_ids(state)
    ids.add(session_id)
    state["completedSessionIds"] = sorted(ids)
    save_state(path, state)


def get_fastf1_sessions(year: int) -> list[ScheduledSession]:
    schedule = fastf1.get_event_schedule(
        year,
        include_testing=False,
        backend="fastf1",
    )

    sessions: list[ScheduledSession] = []

    for _, event in schedule.iterrows():
        event_name = str(event.get("EventName") or "Unknown Event")
        round_number = int(event.get("RoundNumber") or 0)

        for index in range(1, 6):
            session_name = event.get(f"Session{index}")
            session_start = to_utc_datetime(event.get(f"Session{index}DateUtc"))

            if not session_name or pd.isna(session_name) or session_start is None:
                continue

            session_id = (
                f"{year}-r{round_number:02d}-s{index}-"
                f"{session_start.strftime('%Y%m%dT%H%M%SZ')}"
            )

            sessions.append(ScheduledSession(
                session_id=session_id,
                event_name=event_name,
                session_name=str(session_name),
                scheduled_start=session_start,
                year=year,
                round_number=round_number,
            ))

    return sorted(sessions, key=lambda item: item.scheduled_start)


def get_relevant_sessions(now: datetime) -> list[ScheduledSession]:
    sessions: list[ScheduledSession] = []

    for year in {now.year, now.year + 1}:
        try:
            sessions.extend(get_fastf1_sessions(year))
        except Exception as exc:
            print(f"[scheduler] could not load schedule for {year}: {exc}", flush=True)

    return sorted(sessions, key=lambda item: item.scheduled_start)


class LiveScheduler:
    def __init__(
        self,
        manager: LiveManager,
        data_dir: Path,
        poll_seconds: int,
        lead_seconds: int,
        max_session_seconds: int,
    ) -> None:
        self.manager = manager
        self.state_path = data_dir / "scheduler_state.json"
        self.poll_seconds = poll_seconds
        self.lead_seconds = lead_seconds
        self.max_session_seconds = max_session_seconds

    def find_active_session(
        self,
        sessions: list[ScheduledSession],
        state: dict[str, Any],
        now: datetime,
    ) -> ScheduledSession | None:
        done = completed_ids(state)

        for session in sessions:
            if session.session_id in done:
                continue

            start_window = session.scheduled_start - timedelta(
                seconds=self.lead_seconds
            )
            end_window = session.scheduled_start + timedelta(
                seconds=self.max_session_seconds
            )

            if start_window <= now <= end_window:
                return session

        return None

    def metadata_for(self, session: ScheduledSession) -> dict[str, Any]:
        return {
            "eventName": session.event_name,
            "sessionType": session.session_name,
            "sessionName": session.session_name,
            "scheduledStart": format_utc(session.scheduled_start),
            "sessionId": session.session_id,
            "year": session.year,
            "roundNumber": session.round_number,
        }

    def sync_completed_session(
        self,
        state: dict[str, Any],
        status: dict[str, Any],
    ) -> None:
        metadata = status.get("metadata")

        if not isinstance(metadata, dict):
            return

        session_id = metadata.get("sessionId")
        stop_reason = status.get("stopReason")

        if session_id and stop_reason in {
            "manual",
            "session_ended",
            "scheduler_timeout",
        }:
            mark_completed(self.state_path, state, str(session_id))

    async def run(self) -> None:
        print("[scheduler] started", flush=True)

        state = load_state(self.state_path)
        cached_sessions: list[ScheduledSession] = []
        next_schedule_refresh = datetime.min.replace(tzinfo=timezone.utc)

        while True:
            try:
                now = utc_now()

                if now >= next_schedule_refresh:
                    cached_sessions = await asyncio.to_thread(
                        get_relevant_sessions,
                        now,
                    )
                    next_schedule_refresh = now + timedelta(hours=6)
                    print(
                        f"[scheduler] loaded {len(cached_sessions)} sessions",
                        flush=True,
                    )

                status = self.manager.status()
                self.sync_completed_session(state, status)

                active_session = self.find_active_session(
                    cached_sessions,
                    state,
                    now,
                )

                if status.get("running"):
                    metadata = status.get("metadata")
                    running_session_id = (
                        metadata.get("sessionId")
                        if isinstance(metadata, dict)
                        else None
                    )

                    running_session = next(
                        (
                            session
                            for session in cached_sessions
                            if session.session_id == running_session_id
                        ),
                        None,
                    )

                    if (
                        running_session is not None
                        and now > running_session.scheduled_start
                        + timedelta(seconds=self.max_session_seconds)
                    ):
                        print("[scheduler] maximum session duration reached", flush=True)
                        await self.manager.stop("scheduler_timeout")

                elif active_session is not None:
                    print(
                        f"[scheduler] starting "
                        f"{active_session.event_name} — "
                        f"{active_session.session_name}",
                        flush=True,
                    )
                    await self.manager.start(
                        self.metadata_for(active_session)
                    )

            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(f"[scheduler] error: {exc}", flush=True)

            await asyncio.sleep(self.poll_seconds)