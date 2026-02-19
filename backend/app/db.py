from __future__ import annotations

import psycopg
from psycopg.errors import Error as PsycopgError

from .config import Settings


def can_connect(settings: Settings) -> bool:
    """Return whether a database connection can be established."""
    if not settings.database_url:
        return False

    try:
        with psycopg.connect(settings.database_url):
            return True
    except PsycopgError:
        return False

