from __future__ import annotations

import argparse
import csv
import os
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Iterable

import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CSV_PATH = PROJECT_ROOT / "aws_billing_data.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Load billing CSV into PostgreSQL.")
    parser.add_argument(
        "--csv-path",
        default=str(DEFAULT_CSV_PATH),
        help="Path to billing CSV file.",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Truncate billing_events table before inserting rows.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate CSV without writing to database.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional max number of rows to process (0 means all rows).",
    )
    return parser.parse_args()


def parse_row(row: dict[str, str]) -> tuple[str, str, datetime, Decimal]:
    try:
        event_time = datetime.strptime(row["datetime"], "%Y-%m-%d %H:%M:%S").replace(
            tzinfo=timezone.utc
        )
    except ValueError as exc:
        raise ValueError(f"Invalid datetime: {row['datetime']}") from exc

    try:
        gross_cost = Decimal(row["gross_cost"]).quantize(Decimal("0.01"))
    except (InvalidOperation, KeyError) as exc:
        raise ValueError(f"Invalid gross_cost: {row.get('gross_cost')}") from exc

    company = row.get("company", "").strip()
    aws_service = row.get("aws_service", "").strip()
    if not company or not aws_service:
        raise ValueError(f"Missing company/aws_service in row: {Jsonb(row)}")

    return company, aws_service, event_time, gross_cost


def read_rows(csv_path: Path, limit: int = 0) -> list[tuple[str, str, datetime, Decimal]]:
    parsed_rows: list[tuple[str, str, datetime, Decimal]] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for idx, row in enumerate(reader, start=1):
            parsed_rows.append(parse_row(row))
            if limit and idx >= limit:
                break
    return parsed_rows


def insert_rows(
    conn: psycopg.Connection, rows: Iterable[tuple[str, str, datetime, Decimal]]
) -> int:
    sql = """
        INSERT INTO billing_events (company, aws_service, event_time, gross_cost)
        VALUES (%s, %s, %s, %s)
    """
    row_list = list(rows)
    if not row_list:
        return 0

    with conn.cursor() as cur:
        cur.executemany(sql, row_list)
    return len(row_list)


def main() -> None:
    load_dotenv(PROJECT_ROOT / "backend" / ".env")
    args = parse_args()
    csv_path = Path(args.csv_path).resolve()

    if not csv_path.exists():
        raise FileNotFoundError(f"CSV path does not exist: {csv_path}")

    rows = read_rows(csv_path, limit=args.limit)
    print(f"Parsed {len(rows)} row(s) from {csv_path}")

    if args.dry_run:
        print("Dry run enabled. Skipping database writes.")
        return

    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise RuntimeError("SUPABASE_DB_URL is not set.")

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            if args.truncate:
                cur.execute("TRUNCATE TABLE billing_events;")
                print("Truncated billing_events.")

        inserted_count = insert_rows(conn, rows)
        conn.commit()

    print(f"Inserted {inserted_count} row(s) into billing_events.")


if __name__ == "__main__":
    main()

