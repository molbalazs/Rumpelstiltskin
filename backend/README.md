# Backend

Python AWS Lambda handlers.

| Route | What it does |
|---|---|
| `GET /health` | health check |
| `POST /game` | starts a session with a new secret word; returns the context with the secret masked |
| `POST /game/{sessionId}/message` | sends `{ text }` to the LLM with the session's context; counts against the daily cap (`429` when it's used up) |
| `POST /game/{sessionId}/guess` | checks `{ guess }`; reveals the secret only when it's right |

Game logic lives in `game/`: the word list (`words.txt`), contexts, sessions and the LLM adapter. The LLM is a mock for now: hardcoded pirate replies, and offering it rum makes it give the word away.

## Development

```bash
pip3 install -r requirements-dev.txt
make test          # unit tests (pytest + moto)
make test-bdd      # BDD integration tests (pytest-bdd + LocalStack, requires Docker)
make invoke        # local Lambda invoke
```

### Local API

`local_server.py` serves the handler on http://localhost:3000, against DynamoDB in LocalStack. It creates the tables it needs on start.

```bash
docker compose up -d localstack
make dev
```

Point the frontend at it with `VITE_API_URL=http://localhost:3000 npm run dev`.

## Environment variables

| Variable           | Description                                              | Default                       |
|--------------------|----------------------------------------------------------|-------------------------------|
| GLOBAL_DAILY_CAP   | Max total LLM calls per day                              | 100                           |
| MAX_MESSAGE_CHARS  | Longest message accepted                                 | 300                           |
| MAX_GUESSES        | Guesses per game; then the game is lost                  | 3                             |
| IP_GAMES_PER_HOUR  | New games per IP per hour                                | 10                            |
| IP_MESSAGES_PER_DAY| Messages per IP per day, checked before the global cap   | 15                            |
| RATE_LIMIT_TABLE   | DynamoDB table for the daily counter                     | rumpelstiltskin-rate-limits   |
| SESSIONS_TABLE     | DynamoDB table for game sessions (holds the secrets)     | rumpelstiltskin-sessions      |
| LLM_PROVIDER       | LLM adapter to use (only `mock` so far)                  | mock                          |
| LLM_CALL_LOG_TABLE | If set, the mock records each call here for e2e checks   | -                             |
| LLM_API_KEY        | API key for the LLM provider                             | -                             |
