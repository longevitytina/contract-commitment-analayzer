from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    """Environment-driven application settings."""

    database_url: str = os.getenv("DATABASE_URL", "")
    flask_env: str = os.getenv("FLASK_ENV", "development")
    flask_run_port: int = int(os.getenv("FLASK_RUN_PORT", "8000"))

