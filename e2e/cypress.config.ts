import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'cypress'
import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

// The stack under test is configured from the environment:
//   APP_URL           the frontend (defaults to the Vite dev server)
//   API_URL           the API endpoint the frontend talks to
//   AWS_ENDPOINT_URL  DynamoDB endpoint for the steps' checks (LocalStack locally)
//   GLOBAL_DAILY_CAP  the daily message cap the stack runs with
const TABLES = {
  rateLimits: process.env.RATE_LIMIT_TABLE ?? 'rumpelstiltskin-rate-limits',
  sessions: process.env.SESSIONS_TABLE ?? 'rumpelstiltskin-sessions',
  llmCalls: process.env.LLM_CALL_LOG_TABLE ?? 'rumpelstiltskin-llm-calls',
}

const db = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    endpoint: process.env.AWS_ENDPOINT_URL,
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
  }),
)

/** The rate limiter's counter key: the server's local date, YYYY-MM-DD. */
const today = () => new Date().toLocaleDateString('en-CA')

export default defineConfig({
  e2e: {
    baseUrl: process.env.APP_URL ?? 'http://localhost:5173',
    specPattern: 'features/**/*.feature',
    supportFile: false,
    expose: {
      API_URL: (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
      GLOBAL_DAILY_CAP: Number(process.env.GLOBAL_DAILY_CAP ?? 5),
      // Requirements not built yet are tagged @wip and skipped by default.
      // Run them with: npm run test:wip
      tags: 'not @wip',
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config)
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }))
      on('task', {
        async getSecret(sessionId: string) {
          const { Item } = await db.send(new GetCommand({ TableName: TABLES.sessions, Key: { sessionId } }))
          return Item?.secret ?? null
        },
        async seedDailyCount(count: number) {
          await db.send(new PutCommand({ TableName: TABLES.rateLimits, Item: { pk: 'GLOBAL', sk: today(), count } }))
          return null
        },
        async getDailyCount() {
          const { Item } = await db.send(new GetCommand({ TableName: TABLES.rateLimits, Key: { pk: 'GLOBAL', sk: today() } }))
          return Number(Item?.count ?? 0)
        },
        async getLlmCalls(sessionId: string) {
          const { Items } = await db.send(
            new QueryCommand({
              TableName: TABLES.llmCalls,
              KeyConditionExpression: 'sessionId = :s',
              ExpressionAttributeValues: { ':s': sessionId },
            }),
          )
          return (Items ?? []).map(({ systemPrompt, userText }) => ({ systemPrompt, userText }))
        },
        wordList() {
          return readFileSync(join(config.projectRoot, '../backend/game/words.txt'), 'utf8')
            .split('\n')
            .map((w) => w.trim())
            .filter(Boolean)
        },
      })
      return config
    },
  },
})
