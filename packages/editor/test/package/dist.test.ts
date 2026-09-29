import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { Scanner } from '@tailwindcss/oxide'
import postcss, { type Declaration } from 'postcss'
import semver from 'semver'
import { beforeAll, describe, expect, it } from 'vitest'

const packageDir = fileURLToPath(new URL('../..', import.meta.url))
const distDir = join(packageDir, 'dist')
const require = createRequire(import.meta.url)

interface PackageJson {
  name: string
  license: string
  type: string
  exports: Record<string, unknown>
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

const manifest: PackageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))

const shadcnTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
]

const tiptapPeers = ['@tiptap/core', '@tiptap/pm', '@tiptap/react']

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

function distModules(): Array<{ file: string; code: string }> {
  return listFiles(distDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => ({ file: relative(distDir, file), code: readFileSync(file, 'utf8') }))
}

function importedSpecifiers(code: string): string[] {
  const pattern = /(?:\bimport|\bexport)\s*(?:[^'"]*?\sfrom\s*)?["']([^"']+)["']/g
  return [...code.matchAll(pattern)].map((match) => match[1] as string)
}

function packageName(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] as string)
}

function exportConditions(value: unknown): string[] {
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, nested]) => [key, ...exportConditions(nested)])
}

beforeAll(() => {
  if (!existsSync(join(distDir, 'index.js'))) {
    throw new Error('The package is not built; run `pnpm build` first.')
  }
})

describe('package manifest', () => {
  it('is @notra/editor under the MIT license', () => {
    expect(manifest.name).toBe('@notra/editor')
    expect(manifest.license).toBe('MIT')
    const license = readFileSync(join(packageDir, 'LICENSE'), 'utf8')
    expect(license).toMatch(/^MIT License/)
    expect(license).toMatch(/Copyright \(c\) \d{4} Notra contributors/)
    expect(license).toContain('Permission is hereby granted, free of charge')
  })

  it('is distributed as ES modules only', () => {
    expect(manifest.type).toBe('module')
    expect(exportConditions(manifest.exports)).not.toContain('require')
    const files = listFiles(distDir)
    expect(files.filter((file) => /\.c[jt]s$/.test(file))).toEqual([])
    for (const { file, code } of distModules()) {
      expect(code, file).not.toMatch(/\brequire\(|\bmodule\.exports\b|\bexports\.\w+\s*=/)
    }
  })

  it('ships declarations for each JavaScript entry point', () => {
    const entries = Object.entries(manifest.exports).filter(
      ([, target]) => typeof target === 'object' && target !== null,
    ) as Array<[string, Record<string, string>]>
    expect(entries.map(([subpath]) => subpath)).toEqual(['.'])
    for (const [, target] of entries) {
      expect(target.default).toMatch(/\.js$/)
      expect(existsSync(join(packageDir, target.default as string))).toBe(true)
      expect(target.types).toMatch(/\.d\.ts$/)
      expect(existsSync(join(packageDir, target.types as string))).toBe(true)
    }
    expect(existsSync(join(packageDir, manifest.exports['./theme.css'] as string))).toBe(true)
  })

  it('supports React 19 only', () => {
    const latestReact: string = require('react/package.json').version
    expect(semver.major(latestReact)).toBe(19)
    for (const name of ['react', 'react-dom']) {
      const range = manifest.peerDependencies[name] as string
      for (const version of ['19.0.0', latestReact, '19.99.0']) {
        expect(semver.satisfies(version, range), `${name}@${version}`).toBe(true)
      }
      expect(semver.satisfies('18.3.1', range), `${name}@18.3.1`).toBe(false)
    }
  })

  it('peers on Tiptap 3 from 3.31.3', () => {
    for (const name of tiptapPeers) {
      const range = manifest.peerDependencies[name] as string
      for (const version of ['3.31.3', '3.99.0']) {
        expect(semver.satisfies(version, range), `${name}@${version}`).toBe(true)
      }
      for (const version of ['3.31.2', '4.0.0']) {
        expect(semver.satisfies(version, range), `${name}@${version}`).toBe(false)
      }
      expect(manifest.dependencies).not.toHaveProperty(name)
    }
  })

  it('depends on lucide-react for the icons of the default slash menu items', () => {
    expect(manifest.dependencies).toHaveProperty('lucide-react')
    expect(manifest.peerDependencies).not.toHaveProperty('lucide-react')
  })

  it('declares every package that the distributed code imports', () => {
    const imported = new Set(
      distModules()
        .flatMap(({ code }) => importedSpecifiers(code))
        .filter((specifier) => !specifier.startsWith('.'))
        .map(packageName),
    )
    const peers = ['react', 'react-dom', ...tiptapPeers]
    for (const name of imported) {
      if (peers.includes(name)) expect(manifest.peerDependencies).toHaveProperty(name)
      else expect(manifest.dependencies, name).toHaveProperty(name)
    }
    for (const name of Object.keys(manifest.dependencies)) expect(imported).toContain(name)
  })
})

describe('entry point', () => {
  it('exports the primitives, the hook, NotraKit and the default slash menu items', async () => {
    const entry = await import(join(distDir, 'index.js'))
    expect(Object.keys(entry).sort()).toEqual(
      ['NotraEditor', 'NotraKit', 'SlashMenu', 'defaultSlashMenuItems', 'useNotraEditor'].sort(),
    )
    expect(Object.keys(entry.NotraEditor).sort()).toEqual(['Content', 'Root'])
    expect(typeof entry.NotraEditor.Root).toBe('function')
    expect(typeof entry.NotraEditor.Content).toBe('function')
    expect(Object.keys(entry.SlashMenu).sort()).toEqual(
      ['Content', 'Empty', 'Item', 'List', 'Root'].sort(),
    )
    for (const member of Object.values(entry.SlashMenu)) expect(typeof member).toBe('function')
    expect(Array.isArray(entry.defaultSlashMenuItems)).toBe(true)
    expect(entry.defaultSlashMenuItems).toHaveLength(9)
    expect(typeof entry.useNotraEditor).toBe('function')
    expect(entry.NotraKit.name).toBe('notraKit')
    expect(readFileSync(join(distDir, 'theme.css'), 'utf8')).toMatch(
      /^\s*\/\*[\s\S]*?\*\/\s*:root \{/,
    )
  })
})

describe('client directive', () => {
  it('starts every module that defines a component or hook with "use client"', () => {
    const modules = distModules()
    const clientModules = modules.filter(
      ({ code }) =>
        /from\s*["']react(?:\/jsx-runtime)?["']/.test(code) ||
        /\bfunction\s+(?:[A-Z]\w*|use[A-Z]\w*)\s*\(/.test(code) ||
        /\bconst\s+(?:NotraEditor|SlashMenu)\s*=/.test(code),
    )
    expect(clientModules.map(({ file }) => file).sort()).toEqual(
      [
        'content.js',
        'context.js',
        'notra-editor.js',
        'root.js',
        join('slash-menu', 'content.js'),
        join('slash-menu', 'context.js'),
        join('slash-menu', 'default-items.js'),
        join('slash-menu', 'empty.js'),
        join('slash-menu', 'item.js'),
        join('slash-menu', 'list.js'),
        join('slash-menu', 'root.js'),
        join('slash-menu', 'slash-menu.js'),
      ].sort(),
    )
    for (const { file, code } of clientModules) {
      expect(code.startsWith('"use client";') || code.startsWith("'use client';"), file).toBe(true)
    }
  })
})

describe('distributed styles', () => {
  const colorProperty =
    /^(?:color|background-color|border(?:-(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?-color|outline-color|text-decoration-color|caret-color|accent-color|column-rule-color|fill|stroke|--tw-(?:ring|ring-offset|inset-ring|shadow|inset-shadow|drop-shadow|text-shadow)-color|--tw-gradient-(?:from|via|to))$/
  const token = `(${shadcnTokens.join('|')})`
  const tokenValue = new RegExp(
    `^(?:var\\(--(?:color-)?${token}\\)|color-mix\\(in (?:oklab|srgb), var\\(--(?:color-)?${token}\\) \\d+(?:\\.\\d+)?%, transparent\\))$`,
  )
  const keywordValue = /^(?:transparent|currentcolor|inherit)$/i

  async function utilities(): Promise<Map<string, Declaration[]>> {
    const designSystem = await __unstable__loadDesignSystem(
      '@import "tailwindcss"; @import "./dist/theme.css";',
      { base: packageDir },
    )
    const candidates = new Scanner({
      sources: [{ base: distDir, pattern: '**/*.js', negated: false }],
    }).scan()
    const css = designSystem.candidatesToCss(candidates)
    const result = new Map<string, Declaration[]>()
    candidates.forEach((candidate, index) => {
      const source = css[index]
      if (!source) return
      const declarations: Declaration[] = []
      postcss.parse(source).walkDecls((declaration) => {
        declarations.push(declaration)
      })
      result.set(candidate, declarations)
    })
    return result
  }

  it('makes every default class of NotraEditor.Content a Tailwind CSS utility', async () => {
    const { contentClassName } = await import(join(distDir, 'styles.js'))
    const classes = (contentClassName as string).split(' ')
    const generated = await utilities()
    expect(classes.filter((name) => !generated.has(name))).toEqual([])
  })

  it('makes every default class of the slash menu and the empty-line hint a Tailwind CSS utility', async () => {
    const styles: Record<string, string> = await import(join(distDir, 'slash-menu', 'styles.js'))
    const names = Object.keys(styles)
    expect(names).toEqual(
      expect.arrayContaining([
        'slashMenuContentClassName',
        'slashMenuListClassName',
        'slashMenuItemClassName',
        'slashMenuEmptyClassName',
        'emptyLineHintClassName',
      ]),
    )
    const generated = await utilities()
    for (const name of names) {
      const classes = (styles[name] as string).split(' ')
      expect(classes.length, name).toBeGreaterThan(0)
      expect(
        classes.filter((candidate) => !generated.has(candidate)),
        name,
      ).toEqual([])
    }
  })

  it('takes every color from a shadcn semantic token', async () => {
    const generated = await utilities()
    const usedTokens = new Set<string>()
    const violations: string[] = []
    for (const [candidate, declarations] of generated) {
      for (const { prop, value } of declarations) {
        if (!colorProperty.test(prop)) continue
        const match = tokenValue.exec(value)
        if (match) usedTokens.add((match[1] ?? match[2]) as string)
        else if (!keywordValue.test(value)) violations.push(`${candidate}: ${prop}: ${value}`)
      }
    }
    expect(violations).toEqual([])
    expect([...usedTokens].sort()).toEqual(
      [
        'accent',
        'accent-foreground',
        'border',
        'foreground',
        'muted',
        'muted-foreground',
        'popover',
        'popover-foreground',
        'ring',
      ].sort(),
    )

    const theme = postcss.parse(readFileSync(join(distDir, 'theme.css'), 'utf8'))
    const definitions = (selector: string) => {
      const names = new Set<string>()
      theme.walkRules(selector, (rule) => {
        rule.walkDecls((declaration) => {
          names.add(declaration.prop)
        })
      })
      return names
    }
    const themeMappings = new Map<string, string>()
    theme.walkAtRules('theme', (rule) => {
      rule.walkDecls((declaration) => {
        themeMappings.set(declaration.prop, declaration.value)
      })
    })
    for (const name of shadcnTokens) {
      expect(definitions(':root'), `light --${name}`).toContain(`--${name}`)
      expect(definitions('.dark'), `dark --${name}`).toContain(`--${name}`)
      expect(themeMappings.get(`--color-${name}`)).toBe(`var(--${name})`)
    }
  })
})
