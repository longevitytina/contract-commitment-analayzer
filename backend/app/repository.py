from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import psycopg


def list_companies_from_db(db_url: str) -> list[str]:
    if not db_url:
        return []

    query = """
        SELECT DISTINCT company
        FROM billing_events
        ORDER BY company ASC
    """
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
    return [row[0] for row in rows]


def sum_spend_for_period(
    conn: psycopg.Connection,
    company: str,
    service: str,
    period_start: datetime,
    period_end: datetime,
) -> Decimal:
    query = """
        SELECT COALESCE(SUM(gross_cost), 0)
        FROM billing_events
        WHERE company = %s
          AND aws_service = %s
          AND event_time >= %s
          AND event_time < %s
    """
    with conn.cursor() as cur:
        cur.execute(query, (company, service, period_start, period_end))
        row = cur.fetchone()
    value = row[0] if row and row[0] is not None else Decimal("0")
    return Decimal(str(value)).quantize(Decimal("0.01"))

