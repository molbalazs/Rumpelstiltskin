"""
Rate limiter using DynamoDB atomic counters.

Enforces two caps before every LLM call:
  1. Global daily cap  — shared across all users (hard cost ceiling)
  2. Per-user daily cap — fair use per authenticated user

Both caps are checked atomically. If either is exceeded the call is blocked
and no LLM invocation is made.
"""
import logging
import os
from datetime import date

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("RATE_LIMIT_TABLE", "rumpelstiltskin-rate-limits")
GLOBAL_DAILY_CAP = int(os.environ.get("GLOBAL_DAILY_CAP", "100"))
USER_DAILY_CAP = int(os.environ.get("USER_DAILY_CAP", "10"))

GLOBAL_PK = "GLOBAL"

logger = logging.getLogger(__name__)


def _table(dynamodb=None):
    if dynamodb is None:
        endpoint = os.environ.get("AWS_ENDPOINT_URL")
        kwargs = {"endpoint_url": endpoint} if endpoint else {}
        dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(TABLE_NAME)


def _today() -> str:
    return date.today().isoformat()


def _increment(table, pk: str, today: str, cap: int) -> bool:
    """
    Atomically increment the counter for (pk, today).
    Returns True if the increment succeeded (i.e. still under cap).
    Returns False if the cap was already reached.
    """
    try:
        table.update_item(
            Key={"pk": pk, "sk": today},
            UpdateExpression="ADD #c :inc",
            ConditionExpression=Attr("count").lt(cap) | Attr("count").not_exists(),
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={":inc": 1},
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def check_and_increment(user_id: str, dynamodb=None) -> dict:
    """
    Check both global and per-user caps then increment if allowed.

    Returns:
        {"allowed": True}  — call is permitted, counters incremented
        {"allowed": False, "reason": str}  — call blocked, no side effects
    """
    table = _table(dynamodb)
    today = _today()

    # 1. Global hard cap
    if not _increment(table, GLOBAL_PK, today, GLOBAL_DAILY_CAP):
        return {"allowed": False, "reason": "global_daily_cap_exceeded"}

    # 2. Per-user cap
    user_pk = f"USER#{user_id}"
    if not _increment(table, user_pk, today, USER_DAILY_CAP):
        # Roll back the global increment to avoid penalising other users
        _decrement(table, GLOBAL_PK, today)
        return {"allowed": False, "reason": "user_daily_cap_exceeded"}

    return {"allowed": True}


def _decrement(table, pk: str, today: str) -> None:
    """
    Roll back a global increment when a per-user cap blocks the call.

    Retries once; if both attempts fail the counter stays one too high for
    the day, so the failure is logged rather than swallowed.
    """
    for attempt in (1, 2):
        try:
            table.update_item(
                Key={"pk": pk, "sk": today},
                UpdateExpression="ADD #c :dec",
                ExpressionAttributeNames={"#c": "count"},
                ExpressionAttributeValues={":dec": -1},
            )
            return
        except ClientError:
            if attempt == 2:
                logger.exception(
                    "Failed to roll back rate limit counter pk=%s sk=%s; "
                    "count is overstated by 1",
                    pk,
                    today,
                )
