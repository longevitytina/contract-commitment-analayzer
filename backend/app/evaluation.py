from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import psycopg

from .repository import sum_spend_for_period


DATE_FMT = "%Y-%m-%d %H:%M:%S"


def parse_checkin_datetime(value: str) -> datetime:
    return datetime.strptime(value, DATE_FMT).replace(tzinfo=timezone.utc)


def decimal_to_float(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01")))


def checkin_status(start: datetime, end: datetime, now: datetime) -> str:
    if end <= now:
        return "past"
    if start > now:
        return "future"
    return "current"


def evaluate_commitment(
    commitment: dict[str, Any], db_url: str, now: datetime | None = None
) -> dict[str, Any]:
    if not db_url:
        raise RuntimeError("SUPABASE_DB_URL is not set.")

    company = commitment["company"]
    service = commitment["service"]
    checkins = commitment.get("checkins", [])
    now = now or datetime.now(timezone.utc)

    total_committed = Decimal("0")
    total_actual = Decimal("0")
    total_shortfall = Decimal("0")
    all_met = True
    evaluated_checkins: list[dict[str, Any]] = []

    with psycopg.connect(db_url) as conn:
        for checkin in checkins:
            start = parse_checkin_datetime(checkin["start"])
            end = parse_checkin_datetime(checkin["end"])
            committed_amount = Decimal(str(checkin["amount"])).quantize(Decimal("0.01"))
            actual_amount = sum_spend_for_period(conn, company, service, start, end)

            shortfall = max(committed_amount - actual_amount, Decimal("0.00"))
            surplus = max(actual_amount - committed_amount, Decimal("0.00"))
            met = shortfall == Decimal("0.00")

            total_committed += committed_amount
            total_actual += actual_amount
            total_shortfall += shortfall
            all_met = all_met and met

            evaluated_checkins.append(
                {
                    "start": checkin["start"],
                    "end": checkin["end"],
                    "status": checkin_status(start, end, now),
                    "committed_amount": decimal_to_float(committed_amount),
                    "actual_amount": decimal_to_float(actual_amount),
                    "shortfall": decimal_to_float(shortfall),
                    "surplus": decimal_to_float(surplus),
                    "met": met,
                }
            )

    return {
        "id": commitment["id"],
        "name": commitment["name"],
        "company": company,
        "service": service,
        "met": all_met,
        "total_committed": decimal_to_float(total_committed),
        "total_actual": decimal_to_float(total_actual),
        "total_shortfall": decimal_to_float(total_shortfall),
        "checkins": evaluated_checkins,
    }


def summarize_evaluated_commitment(evaluated: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": evaluated["id"],
        "name": evaluated["name"],
        "service": evaluated["service"],
        "met": evaluated["met"],
        "checkin_count": len(evaluated["checkins"]),
        "total_committed": evaluated["total_committed"],
        "total_actual": evaluated["total_actual"],
        "total_shortfall": evaluated["total_shortfall"],
    }

