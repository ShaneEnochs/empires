import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './author-e2e', outputDir: './test-results-author', workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://127.0.0.1:4177', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } },
  webServer: { command: 'npm run dev -- --port 4177 --strictPort', url: 'http://127.0.0.1:4177', reuseExistingServer: false },
});
