import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    env: { HOST: '127.0.0.1', PORT: '4174' },
    url: baseURL + '/health',
  },
});
