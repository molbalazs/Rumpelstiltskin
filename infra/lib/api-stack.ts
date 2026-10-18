import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2'
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

interface ApiStackProps extends cdk.StackProps {
  rateLimitTable: dynamodb.Table
  sessionsTable: dynamodb.Table
  llmCallsTable: dynamodb.Table
}

const LLM_PROVIDER = 'mock'

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
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    })

    props.rateLimitTable.grantReadWriteData(handler)
    props.sessionsTable.grantReadWriteData(handler)
    props.llmCallsTable.grantWriteData(handler)

    const api = new apigateway.HttpApi(this, 'GameApi', {
      apiName: 'rumpelstiltskin-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration('LambdaIntegration', handler),
    })

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiEndpoint,
      exportName: this.apiUrlExportName,
    })
  }
}
