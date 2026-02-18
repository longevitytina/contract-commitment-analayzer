from __future__ import annotations

from flask import Flask, jsonify

from .commitments import commitments_for_company, load_commitments
from .config import Settings
from .db import can_connect
from .evaluation import evaluate_commitment, summarize_evaluated_commitment
from .repository import list_companies_from_db


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

    @app.get("/api/companies")
    def list_companies() -> tuple[object, int]:
        commitments = load_commitments()
        commitment_companies = {
            item["company"] for item in commitments if item.get("company")
        }
        try:
            db_companies = set(list_companies_from_db(settings.supabase_db_url))
        except Exception:
            db_companies = set()
        companies = sorted(commitment_companies | db_companies)
        return jsonify({"companies": companies}), 200

    @app.get("/api/companies/<company>/commitments")
    def list_company_commitments(company: str) -> tuple[object, int]:
        commitments = load_commitments()
        matching_commitments = commitments_for_company(commitments, company)
        if not matching_commitments:
            return jsonify({"error": f"Company '{company}' not found"}), 404

        try:
            evaluated = [
                evaluate_commitment(item, settings.supabase_db_url)
                for item in matching_commitments
            ]
        except Exception as exc:
            return jsonify({"error": f"Failed to evaluate commitments: {exc}"}), 500

        return (
            jsonify(
                {
                    "company": company,
                    "commitments": [
                        summarize_evaluated_commitment(item) for item in evaluated
                    ],
                }
            ),
            200,
        )

    @app.get("/api/companies/<company>/commitments/<int:commitment_id>")
    def get_commitment_detail(company: str, commitment_id: int) -> tuple[object, int]:
        commitments = load_commitments()
        matching = [
            item
            for item in commitments_for_company(commitments, company)
            if item.get("id") == commitment_id
        ]
        if not matching:
            return (
                jsonify(
                    {
                        "error": (
                            f"Commitment '{commitment_id}' not found "
                            f"for company '{company}'"
                        )
                    }
                ),
                404,
            )

        try:
            evaluated = evaluate_commitment(matching[0], settings.supabase_db_url)
        except Exception as exc:
            return jsonify({"error": f"Failed to evaluate commitment: {exc}"}), 500

        return jsonify({"company": company, "commitment": evaluated}), 200

    return app

