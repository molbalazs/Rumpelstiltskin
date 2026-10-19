"""
AWS Lambda handler — entry point for all API Gateway routes.

  GET  /health                     health check
  POST /game                       start a game; returns the masked context
  POST /game/{sessionId}/message   chat with the keeper (counts against the daily cap)
  POST /game/{sessionId}/guess     guess the secret

The secret never appears in a response, except after a correct guess.
"""
import base64
import json
import re

import rate_limiter
from game import contexts, sessions
from game.llm import get_llm
from game.secret_words import new_secret

GAME_ROUTE = re.compile(r"^/game/(?P<session_id>[0-9a-f]{32})/(?P<action>message|guess)$")


def lambda_handler(event: dict, context: object) -> dict:
    """Main Lambda entry point dispatched by API Gateway."""
    route = event.get("rawPath") or event.get("path", "")
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    if route == "/health":
        return _health()

    if method == "POST" and route == "/game":
        return _start_game()

    match = GAME_ROUTE.match(route)
    if method == "POST" and match:
        body = _body(event)
        if body is None:
            return _error(400, "invalid_json")
        session = sessions.get(match["session_id"])
        if session is None:
            return _error(404, "session_not_found")
        if session["status"] == sessions.WON:
            return _error(409, "game_over")
        if match["action"] == "message":
            return _message(session, body)
        return _guess(session, body)

    return _not_found(route)


def _start_game() -> dict:
    context_id = contexts.DEFAULT_CONTEXT
    session = sessions.create(new_secret(), context_id)
    ctx = contexts.CONTEXTS[context_id]
    return _json(200, {
        "sessionId": session["sessionId"],
        "theme": ctx["theme"],
        "difficulty": ctx["difficulty"],
        "context": contexts.masked(context_id),
    })


def _message(session: dict, body: dict) -> dict:
    text = body.get("text")
    if not isinstance(text, str) or not text.strip():
        return _error(400, "empty_message")
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
    if guess.strip().lower() != session["secret"]:
        return _json(200, {"correct": False})
    sessions.mark_won(session["sessionId"])
    return _json(200, {"correct": True, "secret": session["secret"]})


def _body(event: dict) -> dict | None:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode()
    try:
        body = json.loads(raw)
    except ValueError:
        return None
    return body if isinstance(body, dict) else None


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
