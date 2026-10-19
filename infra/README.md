# Infra

AWS CDK (TypeScript) — deploys the full stack to AWS.

## Stacks

- `StorageStack`: DynamoDB tables for the rate limits, game sessions and the mock LLM's call log, all on provisioned capacity inside the free tier
- `ApiStack`: the game Lambda behind a throttled API Gateway HTTP API
- `FrontendStack`: S3 bucket and CloudFront distribution, plus `config.json` with the API URL
- `MonitoringStack`: a $10/month cost budget that emails alerts

## Deploy

```bash
npm install
cdk deploy --all
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- SSM Parameter Store or Secrets Manager entries for secrets (LLM API key, Clerk config), read at runtime. Never put a secret in a Lambda environment variable: it would appear in the CDK diff that CI posts publicly on PRs.

## Cost protection

This is a public, unauthenticated POC, so every layer has a hard limit that costs nothing extra.

| Layer | Limit | Where |
|---|---|---|
| API Gateway | 10 requests/second, burst 20, across all callers. Excess gets a 429 before Lambda runs: at most ~$2/day. | `api-stack.ts` |
| Lambda | 10s timeout, logs kept 7 days | `api-stack.ts` |
| DynamoDB | Provisioned capacity in the always-free tier (15 write / 11 read units in total). Excess is throttled, not billed, and the API answers 503. | `storage-stack.ts` |
| Per player | Messages of up to 300 characters, 3 guesses per game, 10 new games per IP per hour, 15 messages per IP per day | `backend/game/limits.py` |
| LLM | 100 calls a day in total | `GLOBAL_DAILY_CAP` |
| CloudFront | No rate limit; covered by alerts | — |

### Alerts

- **Budget:** `MonitoringStack` emails molbalazs@gmail.com at 50%, 80% and 100% of $10 actual spend, and when the forecast passes $10. Confirm the subscription email from AWS after the first deploy.
- **Cost anomalies:** in the AWS console, open *Billing → Cost Anomaly Detection*. Add an email alert subscription to the default services monitor, with a threshold of $5 total impact. It's free. It isn't in CDK because CloudFormation's support for these resources outside us-east-1 is unclear.

### Kill switch

If an alert fires and traffic looks hostile:

1. **API:** *API Gateway → rumpelstiltskin-api → Throttling*, then set the `$default` stage rate and burst to 0. Every request is refused immediately, at no cost. The next `cdk deploy` restores the limits.
2. **Website:** *CloudFront → the distribution → Disable*. It takes a few minutes to propagate.

### Not yet added

- **AWS WAF on CloudFront** (about $6/month), for per-IP rate limits on the website. Add it once there's real traffic.
- **Before a real launch:** turn off the mock LLM's call logging (`LLM_CALL_LOG_TABLE`) and its "rum" slip-up. Set `max_tokens` on the real provider.
