import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

// Every table runs on small provisioned capacity inside DynamoDB's always-free
// tier (25 write and 25 read units per account in total). Traffic above it is
// throttled rather than billed, which puts a hard $0 ceiling on DynamoDB.
// The backend answers throttled requests with 503 "busy".
const capacity = (writeCapacity: number, readCapacity: number) => ({
  billingMode: dynamodb.BillingMode.PROVISIONED,
  writeCapacity,
  readCapacity,
})

export class StorageStack extends cdk.Stack {
  public readonly rateLimitTable: dynamodb.Table
  public readonly sessionsTable: dynamodb.Table
  public readonly llmCallsTable: dynamodb.Table

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Global daily LLM cap, plus per-IP counters (which expire via the TTL)
    this.rateLimitTable = new dynamodb.Table(this, 'RateLimitTable', {
      tableName: 'rumpelstiltskin-rate-limits',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      ...capacity(8, 5),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // One item per game; holds the secret, which never leaves the backend
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'rumpelstiltskin-sessions',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      ...capacity(5, 5),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Test-only record of what the mock LLM was sent, for e2e checks
    this.llmCallsTable = new dynamodb.Table(this, 'LlmCallsTable', {
      tableName: 'rumpelstiltskin-llm-calls',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'at', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      ...capacity(2, 1),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}
