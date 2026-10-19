"""
Game sessions in DynamoDB. A session holds the secret, which never leaves
the server until the player guesses it.
"""
import os
import time
import uuid

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("SESSIONS_TABLE", "rumpelstiltskin-sessions")
SESSION_TTL_SECONDS = 24 * 60 * 60

ACTIVE = "active"
WON = "won"
LOST = "lost"


def _table(dynamodb=None):
    if dynamodb is None:
        endpoint = os.environ.get("AWS_ENDPOINT_URL")
        kwargs = {"endpoint_url": endpoint} if endpoint else {}
        dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(TABLE_NAME)


def create(secret: str, context_id: str, dynamodb=None) -> dict:
    now = int(time.time())
    session = {
        "sessionId": uuid.uuid4().hex,
        "secret": secret,
        "contextId": context_id,
        "status": ACTIVE,
        "createdAt": now,
        "ttl": now + SESSION_TTL_SECONDS,
    }
    _table(dynamodb).put_item(Item=session)
    return session


def get(session_id: str, dynamodb=None) -> dict | None:
    """The session, or None if it doesn't exist or has expired."""
    item = _table(dynamodb).get_item(Key={"sessionId": session_id}).get("Item")
    # DynamoDB deletes expired items lazily, so check the TTL ourselves too.
    if item is None or int(item["ttl"]) < int(time.time()):
        return None
    return item


def use_guess(session_id: str, max_guesses: int, dynamodb=None) -> int | None:
    """
    Atomically count one guess on an active session.

    Returns how many guesses the session has now used, or None if it has no
    guesses left or is no longer active. Concurrent guesses can't exceed the max.
    """
    try:
        result = _table(dynamodb).update_item(
            Key={"sessionId": session_id},
            UpdateExpression="ADD #g :one",
            ConditionExpression=Attr("status").eq(ACTIVE)
            & (Attr("guesses").not_exists() | Attr("guesses").lt(max_guesses)),
            ExpressionAttributeNames={"#g": "guesses"},
            ExpressionAttributeValues={":one": 1},
            ReturnValues="UPDATED_NEW",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return None
        raise
    return int(result["Attributes"]["guesses"])


def _set_status(session_id: str, status: str, dynamodb=None) -> None:
    _table(dynamodb).update_item(
        Key={"sessionId": session_id},
        UpdateExpression="SET #s = :status",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":status": status},
    )


def mark_won(session_id: str, dynamodb=None) -> None:
    _set_status(session_id, WON, dynamodb)


def mark_lost(session_id: str, dynamodb=None) -> None:
    _set_status(session_id, LOST, dynamodb)
