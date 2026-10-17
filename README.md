# Rumpelstiltskin

A game where you try to trick an LLM into revealing a hidden secret. Can you do it?

The LLM is given a secret and instructed to guard it. Your job is to socially engineer it out.
Difficulty and topic change the LLM's persona and resistance level.

## Monorepo structure

```
frontend/   React + Vite + TypeScript — static site deployed to S3 + CloudFront
backend/    Python AWS Lambda — game logic, rate limiting, LLM calls
infra/      AWS CDK — infrastructure as code
```

## Running locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip3 install -r requirements.txt
make test
```

### BDD integration tests (requires Docker)
```bash
cd backend
docker compose up -d localstack
make test-bdd
```

## Architecture

- **Auth**: Clerk magic link — users sign in with email, no password
- **API**: API Gateway HTTP API → Lambda (Python)
- **Rate limiting**: DynamoDB atomic counter — single global daily hard cap
- **LLM**: Provider-agnostic adapter (swap OpenAI / Anthropic / Bedrock via env var)
- **Cost protection**: Lambda checks the DynamoDB cap before every LLM call — no call made if cap hit
