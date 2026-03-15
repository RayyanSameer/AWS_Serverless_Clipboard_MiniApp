import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://d3vgkdp84m1v8d.cloudfront.net',
  },
  timeout: 30000,
})
