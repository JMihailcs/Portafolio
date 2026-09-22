import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/assistant',
  testMatch: '**/*.spec.ts',           // vitest owns *.test.ts
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: { command: 'npm run dev', port: 4321, reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
