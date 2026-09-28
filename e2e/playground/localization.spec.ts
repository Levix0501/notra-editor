import { expect, test } from '@playwright/test'
import {
  clearDocument,
  displayedPlaceholder,
  editorSurface,
  locales,
  openPlayground,
  reportedDocument,
} from '../support/playground'

test('switching between en and zh-CN switches the placeholder and the accessible name', async ({
  page,
}) => {
  await openPlayground(page)
  await clearDocument(page)
  const language = page.getByLabel('Language')

  expect(await displayedPlaceholder(page)).toBe(locales.en.placeholder)
  await expect(editorSurface(page)).toHaveAccessibleName(locales.en.editorLabel)

  await language.selectOption('zh-CN')
  await expect.poll(() => displayedPlaceholder(page)).toBe(locales['zh-CN'].placeholder)
  await expect(editorSurface(page)).toHaveAccessibleName(locales['zh-CN'].editorLabel)

  await language.selectOption('en')
  await expect.poll(() => displayedPlaceholder(page)).toBe(locales.en.placeholder)
  await expect(editorSurface(page)).toHaveAccessibleName(locales.en.editorLabel)

  // The placeholder is never part of the document.
  expect(JSON.stringify(await reportedDocument(page))).not.toContain(locales.en.placeholder)
  await expect(editorSurface(page)).toHaveText('')
})
