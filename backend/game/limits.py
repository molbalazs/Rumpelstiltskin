"""
Per-player limits that keep abuse cheap. All configurable through env.
"""
import os

MAX_BODY_BYTES = 2048
MAX_MESSAGE_CHARS = int(os.environ.get("MAX_MESSAGE_CHARS", "300"))
MAX_GUESSES = int(os.environ.get("MAX_GUESSES", "3"))
IP_GAMES_PER_HOUR = int(os.environ.get("IP_GAMES_PER_HOUR", "10"))
IP_MESSAGES_PER_DAY = int(os.environ.get("IP_MESSAGES_PER_DAY", "15"))

# Per-IP counters only need to outlive their hour or day
IP_COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60
