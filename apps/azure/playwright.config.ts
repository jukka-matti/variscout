import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // The e2e suite drives the SERVED company-channel Workspace bundle, not any
  // client source in this package (the legacy Azure React client was deleted in
  // the D4 convergence). server.js serves ./dist/ (built by
  // scripts/build-company-workspace.mjs); LOCAL_DEV=1 bypasses EasyAuth.
  webServer: {
    command: 'pnpm build && LOCAL_DEV=1 PORT=5174 node server.js',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
