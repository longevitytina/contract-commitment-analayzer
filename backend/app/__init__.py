from __future__ import annotations

from flask import Flask, jsonify

from .config import Settings
from .db import can_connect


def create_app() -> Flask:
    app = Flask(__name__)
    settings = Settings()
    app.config["SETTINGS"] = settings

    @app.get("/api/health")
    def health() -> tuple[object, int]:
        return (
            jsonify(
                {
                    "status": "ok",
                    "service": "contract-commitment-analyzer-api",
                    "database_url_configured": bool(settings.supabase_db_url),
                    "database_reachable": can_connect(settings),
                }
            ),
            200,
        )

    return app

