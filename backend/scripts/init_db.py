from __future__ import annotations

import argparse
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = PROJECT_ROOT / "backend" / "sql" / "schema.sql"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize PostgreSQL schema.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print schema and exit without connecting to database.",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()

    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    if args.dry_run:
        print("Dry run: schema parsed successfully.")
        print(schema_sql)
        return

    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise RuntimeError("SUPABASE_DB_URL is not set.")

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
        conn.commit()

    print("Schema initialized successfully.")


if __name__ == "__main__":
    main()

