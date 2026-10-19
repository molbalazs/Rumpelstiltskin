"""Shared fixtures: every game table, mocked with moto."""
import boto3
import pytest
from moto import mock_aws

import rate_limiter
from game import llm, sessions


def _create(resource, name, keys):
    resource.create_table(
        TableName=name,
        KeySchema=[{"AttributeName": k, "KeyType": t} for k, t in keys],
        AttributeDefinitions=[{"AttributeName": k, "AttributeType": "S"} for k, _ in keys],
        BillingMode="PAY_PER_REQUEST",
    )


@pytest.fixture
def aws(monkeypatch):
    """moto DynamoDB with the rate-limit, sessions and LLM call-log tables."""
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setattr(rate_limiter, "GLOBAL_DAILY_CAP", 3)
    monkeypatch.setattr(llm, "CALL_LOG_TABLE", "rumpelstiltskin-llm-calls")
    with mock_aws():
        resource = boto3.resource("dynamodb")
        _create(resource, rate_limiter.TABLE_NAME, [("pk", "HASH"), ("sk", "RANGE")])
        _create(resource, sessions.TABLE_NAME, [("sessionId", "HASH")])
        _create(resource, llm.CALL_LOG_TABLE, [("sessionId", "HASH"), ("at", "RANGE")])
        yield resource
