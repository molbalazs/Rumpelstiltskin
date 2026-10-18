"""
Secret word generation from the bundled English word list.
"""
import secrets
from functools import lru_cache
from pathlib import Path

WORDS_FILE = Path(__file__).with_name("words.txt")


@lru_cache(maxsize=1)
def load_words() -> tuple[str, ...]:
    """Common English nouns, lowercase, 4 to 10 letters."""
    return tuple(line.strip() for line in WORDS_FILE.read_text().splitlines() if line.strip())


def new_secret() -> str:
    """Pick a secret word using a cryptographically secure RNG."""
    return secrets.choice(load_words())
