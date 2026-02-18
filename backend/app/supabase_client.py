from __future__ import annotations

from supabase import Client, create_client

from .config import Settings


def build_supabase_client(settings: Settings) -> Client | None:
    """
    Build a Supabase client when credentials are present.

    Returns None so the API can still boot in local setup before env vars are configured.
    """
    if not settings.supabase_url or not settings.supabase_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_key)

