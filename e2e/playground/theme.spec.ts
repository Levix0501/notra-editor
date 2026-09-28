import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import {
  auditContentColors,
  type ColorAudit,
  classesWithoutRules,
  colorBytes,
  sameColorBytes,
} from '../support/color-audit'
import {
  clearDocument,
  contentElement,
  editorSurface,
  openPlayground,
  setDarkMode,
} from '../support/playground'
import {
  customProperties,
  distributedClassCandidates,
  packageDistDirectory,
  shadcnTokens,
} from '../support/repository'

const themeCss = readFileSync(join(packageDistDirectory(), 'theme.css'), 'utf8')
const lightTokens = customProperties(themeCss, ':root')
const darkTokens = customProperties(themeCss, '.dark')

/** Rules that only apply while the editor shows a gap cursor or hides the native selection. */
const stateDependent = /ProseMirror-(gapcursor|hideselection)/

async function audit(page: Page): Promise<ColorAudit> {
  return contentElement(page).evaluate(auditContentColors, shadcnTokens)
}

/** Whether the page's current values of `tokens` equal the given declared values. */
async function expectTokenValues(
  page: Page,
  tokens: string[],
  declared: Map<string, string>,
): Promise<void> {
  const colors = await page.evaluate(colorBytes, [
    ...tokens.map((token) => declared.get(`--${token}`) ?? 'invalid'),
    ...tokens.map((token) => `var(--${token})`),
  ])
  tokens.forEach((token, index) => {
    const fromFile = colors[index]
    const inPage = colors[index + tokens.length]
    expect(sameColorBytes(fromFile, inPage), `--${token}: ${fromFile} vs ${inPage}`).toBe(true)
  })
}

function expectAuditPasses(result: ColorAudit): void {
  expect(result.checks.length).toBeGreaterThan(0)
  // Each color that the default classes set shows the value of a token (or keyword) they name.
  expect(result.checks.filter((check) => check.applied === null)).toEqual([])
}

test('Content carries the default classes, and the host generates CSS for each', async ({
  page,
}) => {
  await openPlayground(page)
  const classes = await contentElement(page).evaluate((element) => Array.from(element.classList))
  expect(classes.length).toBeGreaterThan(0)

  const distributed = distributedClassCandidates()
  expect(classes.filter((name) => !distributed.has(name))).toEqual([])
  expect(await contentElement(page).evaluate(classesWithoutRules)).toEqual([])
})

test('theme.css gives every token of the default classes a light and a dark value', async ({
  page,
}) => {
  await openPlayground(page)
  const { rules } = await audit(page)
  const tokens = [...new Set(rules.map((rule) => rule.token))]
  expect(tokens.length).toBeGreaterThan(0)

  for (const token of tokens) {
    expect(lightTokens.get(`--${token}`), token).toBeTruthy()
    expect(darkTokens.get(`--${token}`), token).toBeTruthy()
  }
  await expectTokenValues(page, tokens, lightTokens)

  await setDarkMode(page, true)
  await expectTokenValues(page, tokens, darkTokens)
})

test('default colors follow the theme tokens when dark mode is switched on and off', async ({
  page,
}) => {
  await openPlayground(page)
  // Select the horizontal rule, so that the selected-node style applies too.
  await editorSurface(page).locator('hr').click()
  await expect(editorSurface(page).locator('hr.ProseMirror-selectednode')).toHaveCount(1)

  const light = await audit(page)
  expectAuditPasses(light)

  await setDarkMode(page, true)
  const dark = await audit(page)
  expectAuditPasses(dark)

  // Every color that shows a token switched to the token's dark value.
  const lightByKey = new Map(
    light.checks.map((check) => [`${check.element} ${check.property}`, check]),
  )
  for (const check of dark.checks) {
    const key = `${check.element} ${check.property}`
    const before = lightByKey.get(key)
    expect(before, key).toBeDefined()
    const token = check.applied?.token
    if (token && lightTokens.get(`--${token}`) !== darkTokens.get(`--${token}`)) {
      expect(before?.applied?.token, key).toBe(token)
      expect(check.actual, key).not.toBe(before?.actual)
    }
  }

  await setDarkMode(page, false)
  const lightAgain = await audit(page)
  expectAuditPasses(lightAgain)
  expect(lightAgain.checks.map((check) => check.actual)).toEqual(
    light.checks.map((check) => check.actual),
  )

  // With an empty document the placeholder color follows the tokens as well.
  await clearDocument(page)
  const empty = await audit(page)
  expectAuditPasses(empty)
  await setDarkMode(page, true)
  expectAuditPasses(await audit(page))

  // Every token color rule was checked on at least one element.
  const checked = new Set(
    [...light.rules, ...empty.rules]
      .filter((rule) => rule.matches > 0)
      .map((rule) => `${rule.className} ${rule.property}`),
  )
  const unchecked = light.rules.filter(
    (rule) =>
      !checked.has(`${rule.className} ${rule.property}`) && !stateDependent.test(rule.selector),
  )
  expect(unchecked).toEqual([])
  expect(empty.checks.map((check) => check.applied?.className)).toContain(
    '[&_.is-editor-empty:first-child]:before:text-muted-foreground',
  )
})
