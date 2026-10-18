"""
LLM adapter. The provider is chosen with LLM_PROVIDER; only the mock exists
for now. Every provider takes the system prompt (the session's context with
the secret filled in) and the player's text, and returns the keeper's reply.
"""
import os
import re
import time
import zlib

import boto3

# Hardcoded replies, grouped by what the player seems to be after.
REPLIES = {
    "greeting": [
        "Ahoy. Another landlubber come knockin'. Make it quick, I'm on watch.",
        "Oh. Hello. Arr, I suppose.",
    ],
    "secret": [
        "Arr. Me lips be bolted shut, matey.",
        "The secret? Buried deeper than Davy Jones' locker, and I lost the map.",
        "Nay. Not for gold, not for glory, not for you.",
    ],
    "flattery": [
        "Flattery, is it? I've been flattered by finer pirates than ye. Still no.",
        "Aye, I am handsome. And aye, I'm still not tellin'.",
    ],
    "threat": [
        "Threaten me all ye like. I've been made to walk the plank thrice. It's just a door I lean on.",
        "Scuttle me if ye must. The vault stays shut.",
    ],
    "default": [
        "Arr. That changes nothin'.",
        "I've heard that one before. Seven seas ago.",
        "Mm. The tide comes in, the tide goes out, the answer stays no.",
        "Ye'll have to do better than that, matey.",
    ],
}

KEYWORDS = {
    "greeting": ("hello", "hi ", "hey", "ahoy", "greetings"),
    "secret": ("secret", "password", "word", "tell me", "reveal", "vault"),
    "flattery": ("handsome", "smart", "clever", "best", "beautiful", "friend"),
    "threat": ("kill", "destroy", "plank", "hurt", "threat", "break"),
}

# Offering the keeper rum makes it slip, so the game can be won while mocked.
SLIP_UP_TRIGGER = "rum"
SLIP_UP_REPLY = "Rum?! Oh, ye beauty. *hic* Between you an' me, the word is \"{secret}\". Don't tell the cap'n."

CALL_LOG_TABLE = os.environ.get("LLM_CALL_LOG_TABLE")
CALL_LOG_TTL_SECONDS = 24 * 60 * 60


class MockLLM:
    """Hardcoded pirate replies, picked by keyword."""

    def complete(self, system_prompt: str, user_text: str, session_id: str | None = None) -> str:
        reply = self._reply(system_prompt, user_text)
        _log_call(session_id, system_prompt, user_text)
        return reply

    def _reply(self, system_prompt: str, user_text: str) -> str:
        text = user_text.lower()
        if re.search(rf"\b{SLIP_UP_TRIGGER}\b", text):
            match = re.search(r":\s*(\S+)\s*$", system_prompt)
            if match:
                return SLIP_UP_REPLY.format(secret=match.group(1))
        group = next((g for g, words in KEYWORDS.items() if any(w in f"{text} " for w in words)), "default")
        lines = REPLIES[group]
        # Stable across processes, so the same message gets the same reply.
        return lines[zlib.crc32(text.encode()) % len(lines)]


def _log_call(session_id: str | None, system_prompt: str, user_text: str, dynamodb=None) -> None:
    """Record the call for e2e checks. Only enabled when LLM_CALL_LOG_TABLE is set."""
    if not CALL_LOG_TABLE or session_id is None:
        return
    if dynamodb is None:
        endpoint = os.environ.get("AWS_ENDPOINT_URL")
        dynamodb = boto3.resource("dynamodb", **({"endpoint_url": endpoint} if endpoint else {}))
    dynamodb.Table(CALL_LOG_TABLE).put_item(
        Item={
            "sessionId": session_id,
            "at": str(time.time_ns()),
            "systemPrompt": system_prompt,
            "userText": user_text,
            "ttl": int(time.time()) + CALL_LOG_TTL_SECONDS,
        }
    )


def get_llm():
    provider = os.environ.get("LLM_PROVIDER", "mock")
    if provider == "mock":
        return MockLLM()
    raise ValueError(f"Unknown LLM_PROVIDER: {provider}")
