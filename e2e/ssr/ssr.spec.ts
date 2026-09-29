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

function slashMenu(page: Page): Locator {
  return page.locator('[data-slot="slash-menu-content"]')
}

test('opens the slash menu after hydration without server or hydration errors', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()} (${message.location().url})`)
    }
  })
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))

  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  const surface = page.getByTestId('empty-editor').locator('[contenteditable="true"]')
  await expect(surface).toBeVisible()
  await surface.click()
  await page.keyboard.type('/')
  await expect(slashMenu(page)).toBeVisible()
  await expect(slashMenu(page).getByRole('option')).toHaveCount(9)
  await page.keyboard.press('Escape')
  await expect(slashMenu(page)).toHaveCount(0)

  expect(problems.filter((problem) => /hydrat/i.test(problem))).toEqual([])
  expect(problems).toEqual([])

  // biome-ignore lint/suspicious/noControlCharactersInRegex: strips terminal color codes
  const log = readFileSync(nextDevLog, 'utf8').replace(/\u001b\[[0-9;]*m/g, '')
  expect(log).toMatch(/GET \/ 200/)
  expect(log).not.toMatch(/⨯|\bError\b|\bGET \/ 5\d\d\b/)
})

test('the slash menu and the empty-line hint take the fixture token values in light and dark mode', async ({
  page,
}) => {
  await page.goto('/')
  const surface = page.getByTestId('empty-editor').locator('[contenteditable="true"]')
  await surface.click()
  await page.keyboard.type('Title')
  await page.keyboard.press('Enter')
  const hint = surface.locator('p').last()
  await expect(hint).toHaveAttribute('data-empty-line-hint', /./)

  const audits: ColorAudit[] = []
  const auditInModes = async (locator: Locator) => {
    for (const dark of [false, true]) {
      await setDark(page, dark)
      const declared = dark ? darkTokens : lightTokens
      const result = await locator.evaluate(auditContentColors, {
        tokens: shadcnTokens,
        subtree: true,
      })
      expectAuditPasses(result)
      const tokens = [...new Set(result.rules.map((rule) => rule.token))]
      expect(tokens.length).toBeGreaterThan(0)
      const colors = await page.evaluate(colorBytes, [
        ...tokens.map((token) => declared.get(`--${token}`) ?? 'invalid'),
        ...tokens.map((token) => `var(--${token})`),
      ])
      tokens.forEach((token, index) => {
        const fromFile = colors[index]
        const inPage = colors[index + tokens.length]
        expect(sameColorBytes(fromFile, inPage), `--${token}: ${fromFile} vs ${inPage}`).toBe(true)
      })
      audits.push(result)
    }
    await setDark(page, false)
  }

  // The empty-line hint.
  await auditInModes(hint)

  // The menu with a highlighted item, other items, a group heading and hints.
  await page.keyboard.type('/')
  await expect(slashMenu(page)).toBeVisible()
  await expect(slashMenu(page).locator('[aria-selected="true"]')).toHaveCount(1)
  await expect(slashMenu(page).locator('[data-slot="slash-menu-group-heading"]')).toHaveCount(1)
  await expect(slashMenu(page).locator('[data-slot="slash-menu-item-hint"]')).toHaveCount(8)
  const distributed = distributedClassCandidates()
  const classes = await slashMenu(page).evaluate((menu) => [
    ...new Set([menu, ...menu.querySelectorAll('*')].flatMap((node) => [...node.classList])),
  ])
  const iconClass = /^lucide/
  expect(classes.filter((name) => !distributed.has(name) && !iconClass.test(name))).toEqual([])
  expect(
    (await slashMenu(page).evaluate(classesWithoutRules, true)).filter(
      (name) => !iconClass.test(name),
    ),
  ).toEqual([])
  await auditInModes(slashMenu(page))

  // The menu with the no-results message.
  await page.keyboard.type('zzzz')
  await expect(slashMenu(page).locator('[data-slot="slash-menu-empty"]')).toBeVisible()
  await auditInModes(slashMenu(page))

  // Every token color rule of these elements was checked on at least one of them.
  const checked = new Set(
    audits.flatMap((audit) =>
      audit.rules
        .filter((rule) => rule.matches > 0)
        .map((rule) => `${rule.className} ${rule.property}`),
    ),
  )
  expect(
    audits
      .flatMap((audit) => audit.rules)
      .filter((rule) => !checked.has(`${rule.className} ${rule.property}`)),
  ).toEqual([])
})
