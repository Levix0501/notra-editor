import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import { nextDevLog } from './ssr/server-log'

const port = 3178

// The server-rendering test reads what the development server prints into this file, which
// the shell truncates whenever the server starts. Test workers load this file too, so it must
// not touch the log itself.
mkdirSync(dirname(nextDevLog), { recursive: true })

export default defineConfig({
  testDir: './ssr',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Run the Next.js CLI directly, so that stopping the server stops every process it started.
    command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port} > "${nextDevLog}" 2>&1`,
    cwd: fileURLToPath(new URL('../fixtures/next-app', import.meta.url)),
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { NEXT_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
  },
})
