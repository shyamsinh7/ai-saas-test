import { defineConfig, devices } from '@playwright/test';

// When BASE_URL is set, test that deployed site and skip the local server.
const deployedUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/*$/, '/') : null;
const port = 4173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  use: { baseURL: deployedUrl ?? `http://localhost:${port}/` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: deployedUrl
    ? undefined
    : {
        command: 'npm start',
        env: { PORT: String(port) },
        url: `http://localhost:${port}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
