import { readFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  auditContentColors,
  type ColorAudit,
  classesWithoutRules,
  colorBytes,
  sameColorBytes,
} from '../support/color-audit'
import {
  customProperties,
  distributedClassCandidates,
  readRepositoryFile,
  shadcnTokens,
} from '../support/repository'
import { nextDevLog } from './server-log'

const globalsCss = readRepositoryFile('fixtures/next-app/app/globals.css')
const lightTokens = customProperties(globalsCss, ':root')
const darkTokens = customProperties(globalsCss, '.dark')

const stateDependent = /ProseMirror-(gapcursor|hideselection)/

function content(page: Page, testId: string): Locator {
  return page.getByTestId(testId).locator('[contenteditable="true"]').locator('xpath=..')
}

async function audit(locator: Locator): Promise<ColorAudit> {
  return locator.evaluate(auditContentColors, shadcnTokens)
}

function expectAuditPasses(result: ColorAudit): void {
  expect(result.checks.length).toBeGreaterThan(0)
  // Each color that the default classes set shows the value of a token (or keyword) they name.
  expect(result.checks.filter((check) => check.applied === null)).toEqual([])
}

async function setDark(page: Page, dark: boolean): Promise<void> {
  await page.evaluate((on) => document.documentElement.classList.toggle('dark', on), dark)
}

test('server-renders the page and hydrates it without a mismatch', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()} (${message.location().url})`)
    }
  })
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))

  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  const html = (await response?.text()) ?? ''
  expect(html).toContain('Notra Editor in the App Router')
  expect(html).not.toContain('contenteditable')

  const surfaces = page.locator('[contenteditable="true"]')
  await expect(surfaces).toHaveCount(2)
  await expect(page.getByTestId('sample-editor').locator('h1')).toHaveText('Heading')

  // The editors respond to input after hydration.
  await page.getByTestId('empty-editor').locator('[contenteditable="true"]').click()
  await page.keyboard.type('# Typed')
  await expect(page.getByTestId('empty-editor').locator('h1')).toHaveText('Typed')
  await expect(page.getByTestId('update-count')).not.toHaveText('Updates: 0')

  expect(problems.filter((problem) => /hydrat/i.test(problem))).toEqual([])
  expect(problems).toEqual([])

  // biome-ignore lint/suspicious/noControlCharactersInRegex: strips terminal color codes
  const log = readFileSync(nextDevLog, 'utf8').replace(/\u001b\[[0-9;]*m/g, '')
  expect(log).toMatch(/GET \/ 200/)
  expect(log).not.toMatch(/⨯|\bError\b|\bGET \/ 5\d\d\b/)
})

test('Content carries the default classes, and the host generates CSS for each', async ({
  page,
}) => {
  await page.goto('/')
  const element = content(page, 'sample-editor')
  const classes = await element.evaluate((node) => Array.from(node.classList))
  expect(classes.length).toBeGreaterThan(0)

  const distributed = distributedClassCandidates()
  expect(classes.filter((name) => !distributed.has(name))).toEqual([])
  expect(await element.evaluate(classesWithoutRules)).toEqual([])
})

test('default colors take the fixture token values in light and dark mode', async ({ page }) => {
  await page.goto('/')
  const sample = content(page, 'sample-editor')
  const empty = content(page, 'empty-editor')
  await expect(sample.locator('hr')).toHaveCount(1)
  await sample.locator('hr').click()
  await expect(sample.locator('hr.ProseMirror-selectednode')).toHaveCount(1)

  for (const dark of [false, true]) {
    await setDark(page, dark)
    // The page uses the fixture's own token values.
    const declared = dark ? darkTokens : lightTokens
    const colors = await page.evaluate(colorBytes, [
      ...shadcnTokens.map((token) => declared.get(`--${token}`) ?? 'invalid'),
      ...shadcnTokens.map((token) => `var(--${token})`),
    ])
    shadcnTokens.forEach((token, index) => {
      const fromFile = colors[index]
      const inPage = colors[index + shadcnTokens.length]
      expect(sameColorBytes(fromFile, inPage), `--${token}: ${fromFile} vs ${inPage}`).toBe(true)
    })

    const sampleAudit = await audit(sample)
    const emptyAudit = await audit(empty)
    expectAuditPasses(sampleAudit)
    expectAuditPasses(emptyAudit)

    const checked = new Set(
      [...sampleAudit.rules, ...emptyAudit.rules]
        .filter((rule) => rule.matches > 0)
        .map((rule) => `${rule.className} ${rule.property}`),
    )
    const unchecked = sampleAudit.rules.filter(
      (rule) =>
        !checked.has(`${rule.className} ${rule.property}`) && !stateDependent.test(rule.selector),
    )
    expect(unchecked).toEqual([])
  }
})

test('the fixture integrates the package as a shadcn host', () => {
  const statements = globalsCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
  expect(statements).toContain('@source "../node_modules/@notra/editor";')
  expect(globalsCss).not.toMatch(/theme\.css/)
  expect(statements.filter((line) => /notra/i.test(line))).toEqual([
    '@source "../node_modules/@notra/editor";',
  ])
  expect(readRepositoryFile('fixtures/next-app/next.config.ts')).not.toMatch(/notra/i)
  expect(readRepositoryFile('fixtures/next-app/postcss.config.mjs')).not.toMatch(/notra/i)

  const manifest = JSON.parse(readRepositoryFile('fixtures/next-app/package.json'))
  const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
  expect(dependencies.filter((name) => name.startsWith('@tiptap/')).sort()).toEqual([
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/react',
  ])
})
