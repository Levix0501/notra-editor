import { expect, test } from '@playwright/test'
import {
  clearDocument,
  editorSurface,
  type JSONNode,
  openPlayground,
  reportedDocument,
} from '../support/playground'

const text = (value: string, marks?: string[]): JSONNode =>
  marks
    ? { type: 'text', marks: marks.map((type) => ({ type })), text: value }
    : { type: 'text', text: value }

const paragraph = (...content: JSONNode[]): JSONNode =>
  content.length ? { type: 'paragraph', content } : { type: 'paragraph' }

const listItem = (value: string): JSONNode => ({
  type: 'listItem',
  content: [paragraph(text(value))],
})

const shortcuts: Array<[string, JSONNode[], string]> = [
  ['# Title', [{ type: 'heading', attrs: { level: 1 }, content: [text('Title')] }], 'h1'],
  ['## Title', [{ type: 'heading', attrs: { level: 2 }, content: [text('Title')] }], 'h2'],
  ['### Title', [{ type: 'heading', attrs: { level: 3 }, content: [text('Title')] }], 'h3'],
  ['- item', [{ type: 'bulletList', content: [listItem('item')] }], 'ul > li'],
  ['* item', [{ type: 'bulletList', content: [listItem('item')] }], 'ul > li'],
  [
    '1. item',
    [{ type: 'orderedList', attrs: { start: 1, type: null }, content: [listItem('item')] }],
    'ol > li',
  ],
  ['> quote', [{ type: 'blockquote', content: [paragraph(text('quote'))] }], 'blockquote'],
  [
    '``` code',
    [{ type: 'codeBlock', attrs: { language: null }, content: [text('code')] }],
    'pre > code',
  ],
  ['---', [{ type: 'horizontalRule' }, paragraph()], 'hr'],
  ['**text**', [paragraph(text('text', ['bold']))], 'strong'],
  ['*text*', [paragraph(text('text', ['italic']))], 'em'],
  ['~~text~~', [paragraph(text('text', ['strike']))], 's'],
  ['`text`', [paragraph(text('text', ['code']))], 'code'],
]

test.describe('Markdown shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await openPlayground(page)
  })

  for (const [keys, expected, selector] of shortcuts) {
    test(`typing ${JSON.stringify(keys)} produces ${selector}`, async ({ page }) => {
      await clearDocument(page)
      await page.keyboard.type(keys)

      await expect(editorSurface(page).locator(selector)).toHaveCount(1)
      await expect.poll(async () => (await reportedDocument(page)).content).toEqual(expected)
    })
  }
})

test.describe('undo and redo', () => {
  test('Mod+Z undoes the latest change and Mod+Shift+Z redoes it', async ({ page }) => {
    await openPlayground(page)
    await clearDocument(page)
    await page.keyboard.type('Hello world')
    await expect
      .poll(async () => (await reportedDocument(page)).content)
      .toEqual([paragraph(text('Hello world'))])

    await page.keyboard.press('ControlOrMeta+z')
    await expect.poll(async () => (await reportedDocument(page)).content).toEqual([paragraph()])
    await expect(editorSurface(page)).not.toContainText('Hello world')

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect
      .poll(async () => (await reportedDocument(page)).content)
      .toEqual([paragraph(text('Hello world'))])
    await expect(editorSurface(page)).toContainText('Hello world')
  })
})

test.describe('onUpdate', () => {
  test('reports the document after an edit', async ({ page }) => {
    await openPlayground(page)
    const before = await reportedDocument(page)
    expect(before.content?.[0]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Notra Editor')],
    })

    await editorSurface(page).locator('h1').click()
    await page.keyboard.press('End')
    await page.keyboard.type('!')

    await expect
      .poll(async () => (await reportedDocument(page)).content?.[0])
      .toEqual({ type: 'heading', attrs: { level: 1 }, content: [text('Notra Editor!')] })
  })
})
