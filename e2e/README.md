# End-to-end requirements

The game's requirements, written in Gherkin in `features/`. They run as end-to-end tests against a whole stack (frontend, API Gateway, Lambda, DynamoDB) with Cypress and [`@badeball/cypress-cucumber-preprocessor`](https://github.com/badeball/cypress-cucumber-preprocessor).

| Feature | Covers |
|---|---|
| `start_game.feature` | pre-defined context, masked secret next to the robot, generated dictionary word |
| `chat.feature` | text through the API Gateway proxy, Lambda run with the session's context |
| `rate_limit.feature` | messages processed only while the DynamoDB counter allows |
| `secret_secrecy.feature` | the secret never reaches the browser |
| `guessing.feature` | solution box, winning on a match |

## Running

```bash
npm install
APP_URL=http://localhost:5173 API_URL=https://<api-id>.execute-api.<region>.amazonaws.com npm test
```

The stack under test needs `LLM_PROVIDER=mock`, which records each LLM call in the test-only `rumpelstiltskin-llm-calls` table. Steps read and seed DynamoDB through `cy.task`, so AWS credentials for that stack must be available.

LocalStack Community doesn't emulate API Gateway HTTP APIs, so the proxy scenarios need a deployed dev stack, LocalStack Pro or `sam local start-api`.

## Work in progress

A requirement that isn't built yet is tagged `@wip`, and `npm test` skips it. Remove the tag once its step definitions in `steps/` and the feature are in place. To run everything tagged `@wip`:

```bash
npm run test:wip
```
