"""Unit tests for the global daily cap in rate_limiter (DynamoDB mocked with moto)."""
from unittest.mock import patch

import boto3
import pytest
from moto import mock_aws

import rate_limiter


@pytest.fixture
def dynamodb(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setattr(rate_limiter, "GLOBAL_DAILY_CAP", 3)
    with mock_aws():
        resource = boto3.resource("dynamodb")
        resource.create_table(
            TableName=rate_limiter.TABLE_NAME,
            KeySchema=[
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "pk", "AttributeType": "S"},
                {"AttributeName": "sk", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield resource


def _count(dynamodb, day):
    item = dynamodb.Table(rate_limiter.TABLE_NAME).get_item(
        Key={"pk": rate_limiter.GLOBAL_PK, "sk": day}
    ).get("Item")
    return item["count"] if item else 0


def test_calls_allowed_up_to_cap(dynamodb):
    results = [rate_limiter.check_and_increment(dynamodb) for _ in range(3)]

    assert all(r == {"allowed": True} for r in results)
    assert _count(dynamodb, rate_limiter._today()) == 3


def test_call_blocked_once_cap_reached(dynamodb):
    for _ in range(3):
        rate_limiter.check_and_increment(dynamodb)

    result = rate_limiter.check_and_increment(dynamodb)

    assert result == {"allowed": False, "reason": "global_daily_cap_exceeded"}
    assert _count(dynamodb, rate_limiter._today()) == 3


def test_counter_resets_on_new_day(dynamodb):
    with patch.object(rate_limiter, "_today", return_value="2026-10-17"):
        for _ in range(3):
            rate_limiter.check_and_increment(dynamodb)
        assert rate_limiter.check_and_increment(dynamodb)["allowed"] is False

    with patch.object(rate_limiter, "_today", return_value="2026-10-18"):
        assert rate_limiter.check_and_increment(dynamodb) == {"allowed": True}

    assert _count(dynamodb, "2026-10-17") == 3
    assert _count(dynamodb, "2026-10-18") == 1
