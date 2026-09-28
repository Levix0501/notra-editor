import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraKit } from '../../src'
import { focusEnd, paste, renderEditor } from './render'

function linkedTexts(content: JSONContent | undefined): Array<{ text?: string; href?: unknown }> {
  const found: Array<{ text?: string; href?: unknown }> = []
  const visit = (node: JSONContent) => {
    const link = node.marks?.find((mark) => mark.type === 'link')
    if (link) found.push({ text: node.text, href: link.attrs?.href })
    for (const child of node.content ?? []) visit(child)
  }
  if (content) visit(content)
  return found
}

describe('automatic links', () => {
  it('links a URL typed before a space', async () => {
    const { editor } = await renderEditor({ extensions: [NotraKit] })
    await focusEnd(editor)
    await userEvent.keyboard('Visit https://example.com now')

    expect(editor.getText()).toBe('Visit https://example.com now')
    expect(linkedTexts(editor.getJSON())).toEqual([
      { text: 'https://example.com', href: 'https://example.com' },
    ])
  })

  it('links a pasted URL', async () => {
    const { editor, surface } = await renderEditor({ extensions: [NotraKit] })
    await focusEnd(editor)
    await paste(surface, { 'text/plain': 'https://example.org' })

    expect(editor.getText()).toBe('https://example.org')
    expect(linkedTexts(editor.getJSON())).toEqual([
      { text: 'https://example.org', href: 'https://example.org' },
    ])
  })
})
