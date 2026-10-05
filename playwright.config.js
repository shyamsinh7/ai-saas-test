import { defineConfig, devices } from '@playwright/test';

// When BASE_URL is set, test the deployed site and skip the local server.
const deployedUrl = process.env.BASE_URL
  ? process.env.BASE_URL.replace(/\/*$/, '/')
  : null;

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.js',
  use: {
    baseURL: deployedUrl || 'http://localhost:4173',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: deployedUrl
    ? undefined
    : {
        command: 'python3 -m http.server 4173',
        url: 'http://localhost:4173/',
        reuseExistingServer: !process.env.CI,
      },
});
