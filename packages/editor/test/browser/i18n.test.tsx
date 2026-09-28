import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { NotraKit, type NotraMessages } from '../../src'
import { locales } from '../../src/messages'
import { beforeContent, renderEditor } from './render'

const { en, 'zh-CN': zhCN } = locales

function placeholderElement(surface: HTMLElement): Element {
  const element = surface.querySelector('.is-editor-empty')
  if (!element) throw new Error('no placeholder element')
  return element
}

function displayedPlaceholder(surface: HTMLElement): string | null {
  return beforeContent(placeholderElement(surface))
}

/** Every text that `root` renders or exposes as an accessible name or description. */
function exposedTexts(root: HTMLElement): string[] {
  const texts: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    texts.push(node.nodeValue ?? '')
  const namingAttributes = [
    'aria-label',
    'aria-description',
    'aria-placeholder',
    'aria-roledescription',
    'aria-valuetext',
    'title',
    'alt',
    'placeholder',
  ]
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const pseudo of ['::before', '::after', '::marker']) {
      const content = getComputedStyle(element, pseudo).content
      if (content && content !== 'none' && content !== 'normal') texts.push(JSON.parse(content))
    }
    for (const attribute of namingAttributes) {
      const value = element.getAttribute(attribute)
      if (value !== null) texts.push(value)
    }
    for (const attribute of ['aria-labelledby', 'aria-describedby']) {
      for (const id of element.getAttribute(attribute)?.split(/\s+/) ?? []) {
        texts.push(document.getElementById(id)?.textContent ?? '')
      }
    }
  }
  return texts.map((text) => text.trim()).filter(Boolean)
}

describe('placeholder', () => {
  it('shows the en placeholder in an empty document without making it content', async () => {
    const { editor, surface } = await renderEditor({ extensions: [NotraKit] })

    expect(displayedPlaceholder(surface)).toBe(en.placeholder)
    expect(JSON.stringify(editor.getJSON())).not.toContain(en.placeholder)
    expect(editor.getText()).not.toContain(en.placeholder)
    expect(editor.getText()).toBe('')
  })

  it('shows no placeholder once the document has text', async () => {
    const { surface } = await renderEditor({
      extensions: [NotraKit],
      initialContent: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
      },
    })
    expect(surface.querySelector('.is-editor-empty')).toBeNull()
  })
})

describe('localization', () => {
  it('defines the same non-empty strings for en and zh-CN', () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort())
    for (const messages of [en, zhCN]) {
      for (const value of Object.values(messages)) {
        expect(typeof value).toBe('string')
        expect(value.trim()).not.toBe('')
      }
    }
    expect(zhCN).not.toEqual(en)
  })

  it('uses en by default', async () => {
    const { surface } = await renderEditor({ extensions: [NotraKit] })
    expect(surface.getAttribute('aria-label')).toBe(en.editorLabel)
    await expect.element(page.getByRole('textbox', { name: en.editorLabel })).toBeVisible()
  })

  it('uses the zh-CN strings', async () => {
    const { surface } = await renderEditor({ extensions: [NotraKit], locale: 'zh-CN' })
    expect(displayedPlaceholder(surface)).toBe(zhCN.placeholder)
    expect(surface.getAttribute('aria-label')).toBe(zhCN.editorLabel)
    await expect.element(page.getByRole('textbox', { name: zhCN.editorLabel })).toBeVisible()
  })

  it('applies messages over the active locale', async () => {
    const { surface } = await renderEditor({
      extensions: [NotraKit],
      locale: 'zh-CN',
      messages: { placeholder: 'Custom placeholder' },
    })
    expect(displayedPlaceholder(surface)).toBe('Custom placeholder')
    expect(surface.getAttribute('aria-label')).toBe(zhCN.editorLabel)
  })

  it('takes every built-in string from the locale and messages', async () => {
    const markers = Object.fromEntries(
      Object.keys(en).map((key) => [key, `marker:${key}`]),
    ) as unknown as NotraMessages
    const { container } = await renderEditor({ extensions: [NotraKit], messages: markers })

    const texts = exposedTexts(container)
    expect(texts.length).toBeGreaterThan(0)
    for (const text of texts) expect(Object.values(markers)).toContain(text)
    expect(new Set(texts)).toEqual(new Set(Object.values(markers)))
  })

  it('updates the strings when locale or messages change', async () => {
    const { surface, rerenderRoot, currentEditor, editor } = await renderEditor({
      extensions: [NotraKit],
    })
    expect(displayedPlaceholder(surface)).toBe(en.placeholder)

    await rerenderRoot({ extensions: [NotraKit], locale: 'zh-CN' })
    expect(currentEditor()).toBe(editor)
    expect(displayedPlaceholder(surface)).toBe(zhCN.placeholder)
    expect(surface.getAttribute('aria-label')).toBe(zhCN.editorLabel)

    await rerenderRoot({
      extensions: [NotraKit],
      locale: 'zh-CN',
      messages: { editorLabel: 'Notes' },
    })
    expect(displayedPlaceholder(surface)).toBe(zhCN.placeholder)
    expect(surface.getAttribute('aria-label')).toBe('Notes')

    await rerenderRoot({ extensions: [NotraKit], locale: 'en' })
    expect(displayedPlaceholder(surface)).toBe(en.placeholder)
    expect(surface.getAttribute('aria-label')).toBe(en.editorLabel)
  })
})
