import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  // Keep one output module per source module, so that only the modules that define React
  // components or hooks carry the `'use client'` directive. Rolldown keeps module-level
  // directives in this mode, so its warning that they may be lost does not apply.
  unbundle: true,
  inputOptions: { checks: { moduleLevelDirective: false } },
  dts: { generator: 'oxc' },
  copy: [{ from: 'src/theme.css', to: 'dist' }],
})

export default config
