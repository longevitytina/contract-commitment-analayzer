from __future__ import annotations

import unittest
from unittest.mock import patch

from psycopg import OperationalError

from backend.app import create_app


class ApiRoutesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.client = self.app.test_client()

    @patch("backend.app.list_companies_from_db")
    @patch("backend.app.load_commitments")
    def test_companies_endpoint_returns_sorted_union(
        self, load_commitments_mock, list_companies_mock
    ) -> None:
        load_commitments_mock.return_value = [
            {"company": "cyberdyne"},
            {"company": "ingen"},
        ]
        list_companies_mock.return_value = ["tyrell", "ingen"]

        response = self.client.get("/api/companies")
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["companies"], ["cyberdyne", "ingen", "tyrell"])

    @patch("backend.app.evaluate_commitment")
    @patch("backend.app.load_commitments")
    def test_company_commitments_happy_path(
        self, load_commitments_mock, evaluate_commitment_mock
    ) -> None:
        load_commitments_mock.return_value = [
            {
                "id": 1,
                "name": "S3 commitment",
                "company": "cyberdyne",
                "service": "s3",
                "checkins": [
                    {
                        "start": "2024-01-01 00:00:00",
                        "end": "2024-02-01 00:00:00",
                        "amount": 1000,
                    }
                ],
            }
        ]
        evaluate_commitment_mock.return_value = {
            "id": 1,
            "name": "S3 commitment",
            "service": "s3",
            "met": False,
            "total_committed": 1000.0,
            "total_actual": 875.25,
            "total_shortfall": 124.75,
            "checkins": [
                {
                    "start": "2024-01-01 00:00:00",
                    "end": "2024-02-01 00:00:00",
                    "committed_amount": 1000.0,
                    "actual_amount": 875.25,
                    "shortfall": 124.75,
                    "surplus": 0.0,
                    "met": False,
                    "status": "past",
                }
            ],
        }

        response = self.client.get("/api/companies/cyberdyne/commitments")
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["company"], "cyberdyne")
        self.assertEqual(len(body["commitments"]), 1)
        summary = body["commitments"][0]
        self.assertIsInstance(summary["total_committed"], float)
        self.assertIsInstance(summary["total_actual"], float)
        self.assertIsInstance(summary["total_shortfall"], float)

    @patch("backend.app.load_commitments")
    def test_company_commitments_invalid_company(self, load_commitments_mock) -> None:
        load_commitments_mock.return_value = [
            {
                "id": 1,
                "name": "S3 commitment",
                "company": "cyberdyne",
                "service": "s3",
                "checkins": [],
            }
        ]

        response = self.client.get("/api/companies/unknown/commitments")
        body = response.get_json()

        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", body["error"])

    @patch("backend.app.evaluate_commitment")
    @patch("backend.app.load_commitments")
    def test_company_commitments_db_unavailable(
        self, load_commitments_mock, evaluate_commitment_mock
    ) -> None:
        load_commitments_mock.return_value = [
            {
                "id": 1,
                "name": "S3 commitment",
                "company": "cyberdyne",
                "service": "s3",
                "checkins": [],
            }
        ]
        # The route logs OperationalError with logger.exception(), so a stack trace
        # appears in test output even though the response assertion is expected.
        evaluate_commitment_mock.side_effect = OperationalError("db unavailable")

        response = self.client.get("/api/companies/cyberdyne/commitments")
        body = response.get_json()

        self.assertEqual(response.status_code, 503)
        self.assertIn("Database unavailable", body["error"])

    @patch("backend.app.evaluate_commitment")
    @patch("backend.app.load_commitments")
    def test_commitment_detail_happy_path(
        self, load_commitments_mock, evaluate_commitment_mock
    ) -> None:
        load_commitments_mock.return_value = [
            {
                "id": 5,
                "name": "Sagemaker commitment",
                "company": "weyland-yutani",
                "service": "sagemaker",
                "checkins": [],
            }
        ]
        evaluate_commitment_mock.return_value = {
            "id": 5,
            "name": "Sagemaker commitment",
            "company": "weyland-yutani",
            "service": "sagemaker",
            "met": True,
            "total_committed": 5000.0,
            "total_actual": 5100.0,
            "total_shortfall": 0.0,
            "checkins": [],
        }

        response = self.client.get("/api/companies/weyland-yutani/commitments/5")
        body = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["company"], "weyland-yutani")
        self.assertEqual(body["commitment"]["id"], 5)

    @patch("backend.app.load_commitments")
    def test_commitment_detail_invalid_commitment(self, load_commitments_mock) -> None:
        load_commitments_mock.return_value = [
            {
                "id": 7,
                "name": "S3 commitment",
                "company": "ingen",
                "service": "s3",
                "checkins": [],
            }
        ]

        response = self.client.get("/api/companies/ingen/commitments/999")
        body = response.get_json()

        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", body["error"])


if __name__ == "__main__":
    unittest.main()
