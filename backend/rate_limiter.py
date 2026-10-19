"""
Rate limiter using DynamoDB atomic counters.

Enforces a single global daily cap before every LLM call — a hard cost
ceiling across all callers. If the cap is reached the call is blocked and
no LLM invocation is made. The same mechanism backs the per-IP limits.
"""
import os
from datetime import date, datetime

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


def _this_hour() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H")


def check_and_increment_key(pk: str, sk: str, cap: int, expires_at: int | None = None, dynamodb=None) -> bool:
    """
    Atomically increment the counter at (pk, sk) if it is still under the cap.

    Returns True if the call is permitted (counter incremented), False if the
    cap is reached (no side effects). With expires_at, the item gets a TTL.
    """
    update = "ADD #c :inc"
    names = {"#c": "count"}
    values = {":inc": 1}
    if expires_at is not None:
        update += " SET #t = if_not_exists(#t, :ttl)"
        names["#t"] = "ttl"
        values[":ttl"] = expires_at
    try:
        _table(dynamodb).update_item(
            Key={"pk": pk, "sk": sk},
            UpdateExpression=update,
            ConditionExpression=Attr("count").lt(cap) | Attr("count").not_exists(),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def check_and_increment(dynamodb=None) -> dict:
    """
    Atomically increment today's global counter if it is still under the cap.

    Returns:
        {"allowed": True}  — call is permitted, counter incremented
        {"allowed": False, "reason": str}  — call blocked, no side effects
    """
    if check_and_increment_key(GLOBAL_PK, _today(), GLOBAL_DAILY_CAP, dynamodb=dynamodb):
        return {"allowed": True}
    return {"allowed": False, "reason": "global_daily_cap_exceeded"}
