# End-to-end requirements

The game's requirements, written in Gherkin in `features/`. They run as end-to-end tests against a whole stack (frontend, API, Lambda, DynamoDB) with Cypress and [`@badeball/cypress-cucumber-preprocessor`](https://github.com/badeball/cypress-cucumber-preprocessor). Step definitions are in `steps/`.

| Feature | Covers |
|---|---|
| `start_game.feature` | pre-defined context, masked secret next to the robot, generated dictionary word |
| `chat.feature` | text through the API Gateway proxy, Lambda run with the session's context |
| `rate_limit.feature` | messages processed only while the DynamoDB counter allows |
| `secret_secrecy.feature` | the secret never reaches the browser |
| `guessing.feature` | solution box, winning on a match |

## Running locally

Run the backend's local API (cap 5) and the frontend against LocalStack, then the suite:

```bash
docker compose -f ../backend/docker-compose.yml up -d localstack
(cd ../backend && GLOBAL_DAILY_CAP=5 make dev) &
(cd ../frontend && VITE_API_URL=http://localhost:3000 npm run dev) &
npm install
AWS_ENDPOINT_URL=http://localhost:4566 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test npm test
```

| Variable | Meaning | Default |
|---|---|---|
| `APP_URL` | the frontend | `http://localhost:5173` |
| `API_URL` | the API the frontend calls | `http://localhost:3000` |
| `AWS_ENDPOINT_URL` | DynamoDB endpoint the steps check and seed | AWS default |
| `GLOBAL_DAILY_CAP` | the cap the stack runs with; `rate_limit.feature` expects 5 | `5` |

The stack under test needs `LLM_PROVIDER=mock` with `LLM_CALL_LOG_TABLE` set, so each LLM call is recorded for the checks.

The local API stands in for API Gateway. The "goes to the API Gateway proxy route" step checks the request path against `API_URL`, so it only proves the proxy when `API_URL` points at a deployed stack. LocalStack Community doesn't emulate API Gateway HTTP APIs.

## Work in progress

A requirement that isn't built yet is tagged `@wip`, and `npm test` skips it. Remove the tag once its step definitions in `steps/` and the feature are in place. To run everything tagged `@wip`:

```bash
npm run test:wip
```
