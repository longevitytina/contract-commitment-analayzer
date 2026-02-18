from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
COMMITMENTS_PATH = PROJECT_ROOT / "spend_commitments.json"


def load_commitments() -> list[dict[str, Any]]:
    with COMMITMENTS_PATH.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    return payload.get("commitments", [])


def commitments_for_company(
    commitments: list[dict[str, Any]], company: str
) -> list[dict[str, Any]]:
    return [item for item in commitments if item.get("company") == company]

