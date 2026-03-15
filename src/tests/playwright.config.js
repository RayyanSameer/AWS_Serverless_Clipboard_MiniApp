import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  use: {
    baseURL: 'https://your-cloudfront-url.cloudfront.net', // or localhost if running locally
  },
  timeout: 30000,
})