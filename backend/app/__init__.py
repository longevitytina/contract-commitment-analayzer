from __future__ import annotations

from flask import Flask, jsonify

from .config import Settings
from .supabase_client import build_supabase_client


def create_app() -> Flask:
    app = Flask(__name__)
    settings = Settings()

    supabase = build_supabase_client(settings)
    app.config["SETTINGS"] = settings
    app.config["SUPABASE_CLIENT"] = supabase

    @app.get("/api/health")
    def health() -> tuple[object, int]:
        return (
            jsonify(
                {
                    "status": "ok",
                    "service": "contract-commitment-analyzer-api",
                    "supabase_configured": supabase is not None,
                }
            ),
            200,
        )

    return app

