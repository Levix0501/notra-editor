import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { expect, test } from '@playwright/test'
import { readRepositoryFile, repositoryRoot } from '../support/repository'

const playgroundDir = join(repositoryRoot, 'apps/playground')

function statements(css: string): string[] {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : [path]
  })
}

test.describe('playground setup', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'checks files, not the browser')

  test('its stylesheet needs only an @source line and theme.css for the package', () => {
    expect(statements(readRepositoryFile('apps/playground/src/styles.css'))).toEqual([
      '@import "tailwindcss";',
      '@import "@notra/editor/theme.css";',
      '@source "../node_modules/@notra/editor";',
    ])
  })

  test('its build configuration has no setting for the package', () => {
    expect(readRepositoryFile('apps/playground/vite.config.ts')).not.toMatch(/notra/i)
  })

  test('it imports the package by name, resolved through the package exports', () => {
    const specifiers = sourceFiles(join(playgroundDir, 'src')).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)].map(
        (match) => match[1] as string,
      ),
    )
    expect(specifiers).toContain('@notra/editor')
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/packages\//)
      if (specifier.startsWith('.')) expect(specifier).toMatch(/^\.\/[\w-]+(\.css)?$/)
    }

    const require = createRequire(join(playgroundDir, 'package.json'))
    const resolved = relative(repositoryRoot, require.resolve('@notra/editor'))
    const manifest = JSON.parse(readRepositoryFile('packages/editor/package.json'))
    expect(resolved).toBe(join('packages/editor', manifest.exports['.'].default))
    const themeCss = relative(repositoryRoot, require.resolve('@notra/editor/theme.css'))
    expect(themeCss).toBe(join('packages/editor', manifest.exports['./theme.css']))
  })

  test('it is a Vite 8 application in the pnpm workspace', () => {
    const require = createRequire(join(playgroundDir, 'package.json'))
    const vite = JSON.parse(readFileSync(require.resolve('vite/package.json'), 'utf8'))
    expect(vite.version).toMatch(/^8\./)
    expect(readRepositoryFile('pnpm-workspace.yaml')).toMatch(/- apps\/\*/)
    expect(readRepositoryFile('pnpm-workspace.yaml')).toMatch(/- packages\/\*/)
  })
})
