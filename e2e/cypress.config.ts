import { defineConfig } from 'cypress'
import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild'

// The stack under test is configured from the environment:
//   APP_URL  the frontend (defaults to the Vite dev server)
//   API_URL  the API Gateway endpoint the frontend talks to
export default defineConfig({
  e2e: {
    baseUrl: process.env.APP_URL ?? 'http://localhost:5173',
    specPattern: 'features/**/*.feature',
    supportFile: false,
    env: {
      API_URL: process.env.API_URL ?? 'http://localhost:3000',
      // Requirements not built yet are tagged @wip and skipped by default.
      // Run them with: npm run test:wip
      tags: 'not @wip',
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config)
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }))
      return config
    },
  },
})
