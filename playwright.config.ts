import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 180_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [
    { name: 'chromium', testDir: './browser', use: { browserName: 'chromium' } },
    { name: 'regression', testDir: './e2e', use: { browserName: 'chromium', baseURL: 'http://127.0.0.1:4176' } },
  ],
  webServer: [{
    command: 'npm run preview -- --port 4175 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  }, {
    command: 'npm run build:regression && npm run preview -- --outDir regression-dist --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176', reuseExistingServer: false, timeout: 30_000,
  }],
});
