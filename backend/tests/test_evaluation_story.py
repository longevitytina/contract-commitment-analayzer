from __future__ import annotations

import unittest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch

from backend.app.evaluation import evaluate_commitment


class EvaluationStoryTests(unittest.TestCase):
    @patch("backend.app.evaluation.sum_spend_for_period")
    @patch("backend.app.evaluation.psycopg.connect")
    def test_evaluate_commitment_tells_met_missed_surplus_story(
        self, connect_mock, sum_spend_mock
    ) -> None:
        sentinel_conn = object()
        connect_mock.return_value.__enter__.return_value = sentinel_conn
        sum_spend_mock.side_effect = [
            Decimal("900.00"),   # missed by 100
            Decimal("1000.00"),  # exact match
            Decimal("1100.00"),  # surplus 100
        ]
        commitment = {
            "id": 1,
            "name": "S3 commitment",
            "company": "cyberdyne",
            "service": "s3",
            "checkins": [
                {"start": "2024-01-01 00:00:00", "end": "2024-02-01 00:00:00", "amount": 1000},
                {"start": "2024-02-01 00:00:00", "end": "2024-03-01 00:00:00", "amount": 1000},
                {"start": "2024-03-01 00:00:00", "end": "2024-04-01 00:00:00", "amount": 1000},
            ],
        }
        now = datetime(2024, 2, 15, tzinfo=timezone.utc)

        evaluated = evaluate_commitment(commitment, db_url="postgresql://local", now=now)

        self.assertFalse(evaluated["met"])
        self.assertEqual(evaluated["total_committed"], 3000.0)
        self.assertEqual(evaluated["total_actual"], 3000.0)
        self.assertEqual(evaluated["total_shortfall"], 100.0)

        checkins = evaluated["checkins"]
        self.assertEqual(checkins[0]["status"], "past")
        self.assertEqual(checkins[0]["shortfall"], 100.0)
        self.assertEqual(checkins[0]["surplus"], 0.0)
        self.assertFalse(checkins[0]["met"])

        self.assertEqual(checkins[1]["status"], "current")
        self.assertEqual(checkins[1]["shortfall"], 0.0)
        self.assertEqual(checkins[1]["surplus"], 0.0)
        self.assertTrue(checkins[1]["met"])

        self.assertEqual(checkins[2]["status"], "future")
        self.assertEqual(checkins[2]["shortfall"], 0.0)
        self.assertEqual(checkins[2]["surplus"], 100.0)
        self.assertTrue(checkins[2]["met"])

        self.assertEqual(sum_spend_mock.call_count, 3)

    @patch("backend.app.evaluation.sum_spend_for_period")
    @patch("backend.app.evaluation.psycopg.connect")
    def test_evaluate_commitment_passes_start_end_boundaries_to_repository(
        self, connect_mock, sum_spend_mock
    ) -> None:
        sentinel_conn = object()
        connect_mock.return_value.__enter__.return_value = sentinel_conn
        sum_spend_mock.return_value = Decimal("1000.00")
        commitment = {
            "id": 2,
            "name": "EC2 commitment",
            "company": "ingen",
            "service": "ec2",
            "checkins": [
                {"start": "2024-01-01 00:00:00", "end": "2024-02-01 00:00:00", "amount": 1000}
            ],
        }

        evaluate_commitment(commitment, db_url="postgresql://local")

        call_args = sum_spend_mock.call_args
        self.assertIsNotNone(call_args)
        self.assertIs(call_args.args[0], sentinel_conn)
        self.assertEqual(call_args.args[1], "ingen")
        self.assertEqual(call_args.args[2], "ec2")
        self.assertEqual(
            call_args.args[3], datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)
        )
        self.assertEqual(
            call_args.args[4], datetime(2024, 2, 1, 0, 0, tzinfo=timezone.utc)
        )

    def test_evaluate_commitment_requires_database_url(self) -> None:
        commitment = {
            "id": 3,
            "name": "CloudWatch commitment",
            "company": "acme",
            "service": "cloudwatch",
            "checkins": [],
        }

        with self.assertRaisesRegex(RuntimeError, "DATABASE_URL is not set."):
            evaluate_commitment(commitment, db_url="")


if __name__ == "__main__":
    unittest.main()
