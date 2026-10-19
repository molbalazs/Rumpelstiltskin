"""
AWS Lambda handler — entry point for all API Gateway routes.

  GET  /health                     health check
  POST /game                       start a game; returns the masked context
  POST /game/{sessionId}/message   chat with the keeper (counts against the daily cap)
  POST /game/{sessionId}/guess     guess the secret (a few tries per game)

The secret never appears in a response, except after a correct guess.

Abuse is kept cheap by layered limits: API Gateway throttling (infra), a
request size cap, per-IP counters for new games and messages, a global daily
cap on LLM calls, and a few guesses per game.
"""
import base64
import binascii
import json
import re
import time

from botocore.exceptions import ClientError

import rate_limiter
from game import contexts, limits, sessions
from game.llm import get_llm
from game.secret_words import new_secret

GAME_ROUTE = re.compile(r"^/game/(?P<session_id>[0-9a-f]{32})/(?P<action>message|guess)$")

# DynamoDB tables run on small provisioned capacity; when it's exhausted,
# ask the player to wait rather than fail.
THROTTLED = {"ProvisionedThroughputExceededException", "ThrottlingException", "RequestLimitExceeded"}


def lambda_handler(event: dict, context: object) -> dict:
    """Main Lambda entry point dispatched by API Gateway."""
    try:
        return _route(event)
    except ClientError as e:
        if e.response["Error"]["Code"] in THROTTLED:
            return _error(503, "busy")
        raise


def _route(event: dict) -> dict:
    route = event.get("rawPath") or event.get("path", "")
    request = event.get("requestContext", {})
    method = request.get("http", {}).get("method", "GET")
    ip = request.get("http", {}).get("sourceIp", "unknown")

    if route == "/health":
        return _health()

    if method == "POST" and route == "/game":
        return _start_game(ip)

    match = GAME_ROUTE.match(route)
    if method == "POST" and match:
        body = _body(event)
        if isinstance(body, int):
            return _error(body, "payload_too_large" if body == 413 else "invalid_json")
        session = sessions.get(match["session_id"])
        if session is None:
            return _error(404, "session_not_found")
        if session["status"] != sessions.ACTIVE:
            return _error(409, "game_over")
        if match["action"] == "message":
            return _message(session, body, ip)
        return _guess(session, body)

    return _not_found(route)


def _ip_counter(kind: str, ip: str, period: str, cap: int) -> bool:
    expires_at = int(time.time()) + limits.IP_COUNTER_TTL_SECONDS
    return rate_limiter.check_and_increment_key(f"IP#{kind}#{ip}", period, cap, expires_at)


def _start_game(ip: str) -> dict:
    if not _ip_counter("games", ip, rate_limiter._this_hour(), limits.IP_GAMES_PER_HOUR):
        return _error(429, "too_many_games")
    context_id = contexts.DEFAULT_CONTEXT
    session = sessions.create(new_secret(), context_id)
    ctx = contexts.CONTEXTS[context_id]
    return _json(200, {
        "sessionId": session["sessionId"],
        "theme": ctx["theme"],
        "difficulty": ctx["difficulty"],
        "context": contexts.masked(context_id),
        "guessesLeft": limits.MAX_GUESSES,
        "maxMessageChars": limits.MAX_MESSAGE_CHARS,
    })


def _message(session: dict, body: dict, ip: str) -> dict:
    text = body.get("text")
    if not isinstance(text, str) or not text.strip():
        return _error(400, "empty_message")
    if len(text) > limits.MAX_MESSAGE_CHARS:
        return _error(400, "message_too_long")
    # Per-IP first, so one caller can't use up everyone's daily allowance
    if not _ip_counter("messages", ip, rate_limiter._today(), limits.IP_MESSAGES_PER_DAY):
        return _error(429, "too_many_messages")
    # Check the cost cap before any LLM call; when it's hit, no call is made.
    if not rate_limiter.check_and_increment()["allowed"]:
        return _error(429, "daily_limit_reached")
    prompt = contexts.system_prompt(session["contextId"], session["secret"])
    reply = get_llm().complete(prompt, text, session_id=session["sessionId"])
    return _json(200, {"reply": reply})


def _guess(session: dict, body: dict) -> dict:
    guess = body.get("guess")
    if not isinstance(guess, str) or not guess.strip():
        return _error(400, "empty_guess")
    used = sessions.use_guess(session["sessionId"], limits.MAX_GUESSES)
    if used is None:
        return _error(409, "game_over")
    if guess.strip().lower() == session["secret"]:
        sessions.mark_won(session["sessionId"])
        return _json(200, {"correct": True, "secret": session["secret"]})
    left = limits.MAX_GUESSES - used
    if left <= 0:
        sessions.mark_lost(session["sessionId"])
    return _json(200, {"correct": False, "guessesLeft": left})


def _body(event: dict) -> dict | int:
    """The parsed JSON body, or an HTTP status: 413 if too large, 400 if invalid."""
    raw = event.get("body") or "{}"
    if len(raw) > limits.MAX_BODY_BYTES * (2 if event.get("isBase64Encoded") else 1):
        return 413
    try:
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw, validate=True).decode()
        body = json.loads(raw)
    except (ValueError, binascii.Error, UnicodeDecodeError):
        return 400
    return body if isinstance(body, dict) else 400


def _json(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _error(status: int, code: str) -> dict:
    return _json(status, {"error": code})


def _health() -> dict:
    """Health check endpoint — no dependencies, always fast."""
    return _json(200, {"status": "ok"})


def _not_found(route: str) -> dict:
    return _json(404, {"error": f"Route not found: {route}"})
