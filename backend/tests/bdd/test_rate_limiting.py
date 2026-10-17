"""
BDD step definitions for rate limiting scenarios.
Runs against LocalStack (real DynamoDB emulation).

Requires:
  - LocalStack running on localhost:4566
  - AWS_ENDPOINT_URL=http://localhost:4566 set (or handled by conftest)
"""
import os
import boto3
import pytest
from pytest_bdd import given, when, then, scenario

# Point all AWS calls at LocalStack
LOCALSTACK_ENDPOINT = "http://localhost:4566"
TABLE_NAME = "rumpelstiltskin-rate-limits"
AWS_REGION = "us-east-1"


@pytest.fixture(scope="module")
def dynamodb():
    """DynamoDB resource pointed at LocalStack."""
    return boto3.resource(
        "dynamodb",
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


@pytest.fixture(scope="module")
def rate_limit_table(dynamodb):
    """Create the rate limit table in LocalStack for the test module."""
    existing = [t.name for t in dynamodb.tables.all()]
    if TABLE_NAME not in existing:
        table = dynamodb.create_table(
            TableName=TABLE_NAME,
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
        table.wait_until_exists()
    return dynamodb.Table(TABLE_NAME)


# ---------------------------------------------------------------------------
# Scenario
# ---------------------------------------------------------------------------

@scenario("features/rate_limiting.feature", "First call of the day is allowed")
def test_first_call_allowed():
    pass


@given("the rate limit table exists", target_fixture="table")
def table_exists(rate_limit_table):
    return rate_limit_table


@when("a call is made", target_fixture="result")
def call_is_made(table):
    # Import here so the module-level env var is set first
    import sys
    import importlib

    os.environ["AWS_ENDPOINT_URL"] = LOCALSTACK_ENDPOINT
    os.environ["RATE_LIMIT_TABLE"] = TABLE_NAME
    os.environ["GLOBAL_DAILY_CAP"] = "100"
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION
    os.environ["AWS_ACCESS_KEY_ID"] = "test"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test"

    # Reload to pick up env vars
    if "rate_limiter" in sys.modules:
        importlib.reload(sys.modules["rate_limiter"])
    from rate_limiter import check_and_increment

    return check_and_increment()


@then("the call is allowed")
def call_is_allowed(result):
    assert result["allowed"] is True, f"Expected allowed=True but got: {result}"
