# Backend

Python AWS Lambda handlers.

## Development

```bash
pip3 install -r requirements.txt
make test          # unit tests (pytest + moto)
make test-bdd      # BDD integration tests (pytest-bdd + LocalStack, requires Docker)
make invoke        # local Lambda invoke
```

## Environment variables

| Variable          | Description                              | Default |
|-------------------|------------------------------------------|---------|
| GLOBAL_DAILY_CAP  | Max total LLM calls per day              | 100     |
| LLM_PROVIDER      | LLM adapter to use (mock/openai)         | mock    |
| LLM_API_KEY       | API key for the LLM provider             | -       |
