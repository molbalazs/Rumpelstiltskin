# Infra

AWS CDK (TypeScript) — deploys the full stack to AWS.

## Stacks

- `StorageStack` — DynamoDB table for sessions and rate limiting
- `ApiStack` — Lambda functions + API Gateway HTTP API + Clerk JWT authorizer
- `FrontendStack` — S3 bucket + CloudFront distribution

## Deploy

```bash
npm install
cdk deploy --all
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- SSM Parameter Store entries for secrets (LLM API key, Clerk config)
