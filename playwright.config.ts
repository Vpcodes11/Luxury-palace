import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests', timeout: 45000, fullyParallel: false, workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-unsafe-swiftshader'] } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
})
