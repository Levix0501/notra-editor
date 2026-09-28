import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    projects: [
      {
        plugins: [react(), tailwindcss()],
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.{ts,tsx}'],
          setupFiles: ['test/browser/setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'package',
          include: ['test/package/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})

export default config
