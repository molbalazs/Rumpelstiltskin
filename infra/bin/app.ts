#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { StorageStack } from '../lib/storage-stack'
import { ApiStack } from '../lib/api-stack'
import { FrontendStack } from '../lib/frontend-stack'

const app = new cdk.App()

const env = {
  account: '231561175341',
  region: 'eu-west-1',
}

const storage = new StorageStack(app, 'RumpelstiltskinStorage', { env })

const api = new ApiStack(app, 'RumpelstiltskinApi', {
  env,
  rateLimitTable: storage.rateLimitTable,
  sessionsTable: storage.sessionsTable,
  llmCallsTable: storage.llmCallsTable,
})

const frontend = new FrontendStack(app, 'RumpelstiltskinFrontend', {
  env,
  apiUrlExportName: api.apiUrlExportName,
})
frontend.addDependency(api)
