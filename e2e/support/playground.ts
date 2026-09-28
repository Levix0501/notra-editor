import { expect, type Locator, type Page } from '@playwright/test'

/** A node of a Tiptap JSON document. */
export interface JSONNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

/** Some of the built-in strings of the package's `en` and `zh-CN` locales. */
export const locales = {
  en: {
    placeholder: 'Start writing…',
    editorLabel: 'Document editor',
    slashMenuHint: 'Type / for commands',
    slashMenuEmpty: 'No results',
    blockText: 'Text',
    blockHeading2: 'Heading 2',
    blockBulletList: 'Bulleted list',
    blockQuote: 'Quote',
  },
  'zh-CN': {
    placeholder: '开始输入…',
    editorLabel: '文档编辑器',
    slashMenuHint: '输入 / 唤出命令',
    slashMenuEmpty: '无结果',
    blockText: '正文',
    blockHeading2: '标题 2',
    blockBulletList: '无序列表',
    blockQuote: '引用',
  },
} as const

/** The editable surface. */
export function editorSurface(page: Page): Locator {
  return page.locator('[contenteditable="true"]')
}

/** The element that `NotraEditor.Content` renders. */
export function contentElement(page: Page): Locator {
  return editorSurface(page).locator('xpath=..')
}

/** Opens the playground and waits for the editor. */
export async function openPlayground(page: Page): Promise<void> {
  await page.goto('/')
  await expect(editorSurface(page)).toBeVisible()
}

/** The document that the playground last received through `onUpdate`. */
export async function reportedDocument(page: Page): Promise<JSONNode> {
  return JSON.parse((await page.getByTestId('document-json').textContent()) ?? 'null')
}

/** Empties the document with the playground's Clear button and leaves the editor focused. */
export async function clearDocument(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect
    .poll(async () => (await reportedDocument(page)).content)
    .toEqual([{ type: 'paragraph' }])
  await expect(editorSurface(page)).toBeFocused()
}

/** The placeholder text that the page displays, if any. */
export async function displayedPlaceholder(page: Page): Promise<string | null> {
  const empty = editorSurface(page).locator('.is-editor-empty')
  if ((await empty.count()) === 0) return null
  return empty.evaluate((element) => {
    const content = getComputedStyle(element, '::before').content
    if (!content || content === 'none' || content === 'normal') return null
    return JSON.parse(content) as string
  })
}

/** Sets the dark mode switch of the playground. */
export async function setDarkMode(page: Page, dark: boolean): Promise<void> {
  await page.getByLabel('Dark mode').setChecked(dark)
  await expect(page.locator('html')).toHaveClass(dark ? /(^|\s)dark(\s|$)/ : /^(?!.*\bdark\b)/)
}

/** The element that `SlashMenu.Content` renders while the slash menu is open. */
export function slashMenu(page: Page): Locator {
  return page.locator('[data-slot="slash-menu-content"]')
}

/** The titles of the items that the slash menu displays, in display order. */
export async function slashMenuTitles(page: Page): Promise<string[]> {
  return slashMenu(page)
    .locator('[role="option"] [data-slot="slash-menu-item-title"]')
    .allTextContents()
}

/** The text that CSS generates before each paragraph of the editable surface. */
export async function paragraphHints(page: Page): Promise<Array<string | null>> {
  return editorSurface(page)
    .locator('p')
    .evaluateAll((paragraphs) =>
      paragraphs.map((paragraph) => {
        const content = getComputedStyle(paragraph, '::before').content
        if (!content || content === 'none' || content === 'normal') return null
        return (JSON.parse(content) as string) || null
      }),
    )
}
