import { expect, type Page, test } from '@playwright/test'
import {
  clearDocument,
  editorSurface,
  type JSONNode,
  locales,
  openPlayground,
  paragraphHints,
  reportedDocument,
  slashMenu,
  slashMenuTitles,
} from '../support/playground'

const text = (value: string): JSONNode => ({ type: 'text', text: value })

const paragraph = (value?: string): JSONNode =>
  value ? { type: 'paragraph', content: [text(value)] } : { type: 'paragraph' }

async function documentContent(page: Page): Promise<JSONNode[] | undefined> {
  return (await reportedDocument(page)).content
}

test.describe('slash menu', () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page)
    await clearDocument(page)
  })

  test('opens on / and filters by a Pinyin query', async ({ page }) => {
    await page.keyboard.type('/')
    await expect(slashMenu(page)).toBeVisible()
    await expect.poll(() => slashMenuTitles(page)).toHaveLength(9)

    await page.keyboard.type('yinyong')
    await expect.poll(() => slashMenuTitles(page)).toEqual([locales.en.blockQuote])
  })

  test('selects Heading 2 with the arrow keys and Enter, and Mod+Z undoes it', async ({ page }) => {
    await page.keyboard.type('/')
    await expect(slashMenu(page)).toBeVisible()
    await expect.poll(() => documentContent(page)).toEqual([paragraph('/')])

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await expect(slashMenu(page).locator('[aria-selected="true"]')).toContainText(
      locales.en.blockHeading2,
    )
    await page.keyboard.press('Enter')

    await expect(slashMenu(page)).toHaveCount(0)
    await expect
      .poll(() => documentContent(page))
      .toEqual([{ type: 'heading', attrs: { level: 2 } }])
    await expect(editorSurface(page).locator('h2')).toHaveCount(1)
    await expect(editorSurface(page)).toBeFocused()

    await page.keyboard.press('ControlOrMeta+z')
    await expect.poll(() => documentContent(page)).toEqual([paragraph('/')])
  })

  test('selects Bulleted list with the arrow keys and Enter after other text', async ({ page }) => {
    await page.keyboard.type('abc ')
    await page.keyboard.type('/')
    await expect(slashMenu(page)).toBeVisible()

    for (let press = 0; press < 5; press += 1) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await expect(slashMenu(page).locator('[aria-selected="true"]')).toContainText(
      locales.en.blockBulletList,
    )
    await page.keyboard.press('Enter')

    await expect(slashMenu(page)).toHaveCount(0)
    await expect
      .poll(() => documentContent(page))
      .toEqual([
        paragraph('abc '),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph()] }] },
      ])
    await expect(editorSurface(page)).toBeFocused()

    // The cursor is in the paragraph of the new list item.
    await page.keyboard.type('x')
    await expect
      .poll(() => documentContent(page))
      .toEqual([
        paragraph('abc '),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('x')] }] },
      ])
  })

  test('puts a bullet list after a paragraph with other text', async ({ page }) => {
    await page.keyboard.type('abc ')
    await page.keyboard.type('/')
    await expect(slashMenu(page)).toBeVisible()
    await slashMenu(page).getByRole('option', { name: locales.en.blockBulletList }).click()

    await expect(slashMenu(page)).toHaveCount(0)
    await expect
      .poll(() => documentContent(page))
      .toEqual([
        paragraph('abc '),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph()] }] },
      ])
    await expect(editorSurface(page)).toBeFocused()

    await page.keyboard.press('ControlOrMeta+z')
    await expect.poll(() => documentContent(page)).toEqual([paragraph('abc /')])
  })

  test('closes with Escape and keeps the typed text', async ({ page }) => {
    await page.keyboard.type('/he')
    await expect(slashMenu(page)).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(slashMenu(page)).toHaveCount(0)
    await expect.poll(() => documentContent(page)).toEqual([paragraph('/he')])
  })

  test('shows the empty-line hint in a new empty paragraph', async ({ page }) => {
    await page.keyboard.type('Title')
    await page.keyboard.press('Enter')

    await expect.poll(() => paragraphHints(page)).toEqual([null, locales.en.slashMenuHint])
    expect(JSON.stringify(await reportedDocument(page))).not.toContain(locales.en.slashMenuHint)
  })

  test('shows the zh-CN titles after switching the language', async ({ page }) => {
    await page.getByLabel('Language').selectOption('zh-CN')
    await clearDocument(page)
    await page.keyboard.type('/')

    await expect(slashMenu(page)).toBeVisible()
    await expect.poll(async () => (await slashMenuTitles(page))[0]).toBe(locales['zh-CN'].blockText)
  })
})
