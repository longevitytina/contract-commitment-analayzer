from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Environment-driven application settings."""

    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_db_url: str = os.getenv("SUPABASE_DB_URL", "")
    flask_env: str = os.getenv("FLASK_ENV", "development")
    flask_run_port: int = int(os.getenv("FLASK_RUN_PORT", "8000"))

