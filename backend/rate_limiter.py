"""
Rate limiter using a DynamoDB atomic counter.

Enforces a single global daily cap before every LLM call — a hard cost
ceiling across all callers. If the cap is reached the call is blocked and
no LLM invocation is made.
"""
import os
from datetime import date

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("RATE_LIMIT_TABLE", "rumpelstiltskin-rate-limits")
GLOBAL_DAILY_CAP = int(os.environ.get("GLOBAL_DAILY_CAP", "100"))

GLOBAL_PK = "GLOBAL"


def _table(dynamodb=None):
    if dynamodb is None:
        endpoint = os.environ.get("AWS_ENDPOINT_URL")
        kwargs = {"endpoint_url": endpoint} if endpoint else {}
        dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(TABLE_NAME)


def _today() -> str:
    return date.today().isoformat()


def check_and_increment(dynamodb=None) -> dict:
    """
    Atomically increment today's global counter if it is still under the cap.

    Returns:
        {"allowed": True}  — call is permitted, counter incremented
        {"allowed": False, "reason": str}  — call blocked, no side effects
    """
    try:
        _table(dynamodb).update_item(
            Key={"pk": GLOBAL_PK, "sk": _today()},
            UpdateExpression="ADD #c :inc",
            ConditionExpression=Attr("count").lt(GLOBAL_DAILY_CAP) | Attr("count").not_exists(),
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={":inc": 1},
        )
        return {"allowed": True}
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"allowed": False, "reason": "global_daily_cap_exceeded"}
        raise
