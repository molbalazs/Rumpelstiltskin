import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class StorageStack extends cdk.Stack {
  public readonly rateLimitTable: dynamodb.Table
  public readonly sessionsTable: dynamodb.Table
  public readonly llmCallsTable: dynamodb.Table

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.rateLimitTable = new dynamodb.Table(this, 'RateLimitTable', {
      tableName: 'rumpelstiltskin-rate-limits',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // One item per game; holds the secret, which never leaves the backend
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'rumpelstiltskin-sessions',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Test-only record of what the mock LLM was sent, for e2e checks
    this.llmCallsTable = new dynamodb.Table(this, 'LlmCallsTable', {
      tableName: 'rumpelstiltskin-llm-calls',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'at', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}
