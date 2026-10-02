import { defineConfig, devices } from '@playwright/test'
const remoteURL = process.env.PLAYWRIGHT_BASE_URL
export default defineConfig({
  testDir: './tests', timeout: 45000, fullyParallel: false, workers: 2,
  use: { baseURL: remoteURL || 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: remoteURL ? undefined : { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-unsafe-swiftshader'] } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
})
