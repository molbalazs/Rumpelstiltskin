import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2'
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface ApiStackProps extends cdk.StackProps {
  rateLimitTable: dynamodb.Table
  sessionsTable: dynamodb.Table
  llmCallsTable: dynamodb.Table
}

const LLM_PROVIDER = 'mock'

// Only the deployed site and local dev servers may call the API from a browser.
// Scripts ignore CORS; the stage throttle below is what bounds abuse.
const ALLOWED_ORIGINS = [
  'https://d3mljvfc86c0ww.cloudfront.net',
  'http://localhost:5173',
  'http://localhost:5174',
]

// Requests above this are rejected by API Gateway with 429 before Lambda runs:
// at most ~864k requests/day, about $2/day across API Gateway and Lambda.
const THROTTLE = { rateLimit: 10, burstLimit: 20 }

export class ApiStack extends cdk.Stack {
  public readonly apiUrlExportName = 'RumpelstiltskinApiUrl'

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const handler = new lambda.Function(this, 'GameHandler', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      // Bundle dependencies via Docker so boto3 is present in the Lambda runtime.
      // /asset-input  = read-only mount of the source directory (../backend)
      // /asset-output = write destination that CDK zips up and uploads
      code: lambda.Code.fromAsset('../backend', {
        exclude: ['.venv', '**/__pycache__', '.pytest_cache', 'tests'],
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r /asset-input/requirements.txt -t /asset-output --quiet && cp -r /asset-input/handler.py /asset-input/rate_limiter.py /asset-input/game /asset-output/',
          ],
        },
      }),
      environment: {
        RATE_LIMIT_TABLE: props.rateLimitTable.tableName,
        SESSIONS_TABLE: props.sessionsTable.tableName,
        GLOBAL_DAILY_CAP: '100',
        LLM_PROVIDER,
        // The mock records what it was sent so e2e tests can check it.
        // A real provider must not log prompts, since they hold the secret.
        ...(LLM_PROVIDER === 'mock' ? { LLM_CALL_LOG_TABLE: props.llmCallsTable.tableName } : {}),
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    props.rateLimitTable.grantReadWriteData(handler)
    props.sessionsTable.grantReadWriteData(handler)
    props.llmCallsTable.grantWriteData(handler)

    const api = new apigateway.HttpApi(this, 'GameApi', {
      apiName: 'rumpelstiltskin-api',
      corsPreflight: {
        allowOrigins: ALLOWED_ORIGINS,
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    })

    // Throttle the existing $default stage in place. Replacing the stage
    // would clash with the old one over the "$default" name.
    const stage = api.defaultStage!.node.defaultChild as apigateway.CfnStage
    stage.defaultRouteSettings = {
      throttlingRateLimit: THROTTLE.rateLimit,
      throttlingBurstLimit: THROTTLE.burstLimit,
    }

    // GET and POST only, not ANY: an ANY route would also catch the browser's
    // CORS preflight (OPTIONS) and send it to the Lambda. Without an OPTIONS
    // route, API Gateway answers preflights itself from corsPreflight above.
    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('LambdaIntegration', handler),
    })

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiEndpoint,
      exportName: this.apiUrlExportName,
    })
  }
}
