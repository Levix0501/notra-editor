import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraKit } from '../../src'
import { focusEditor, focusEnd, renderEditor } from './render'

const text = (value: string, marks?: string[]): JSONContent =>
  marks
    ? { type: 'text', marks: marks.map((type) => ({ type })), text: value }
    : { type: 'text', text: value }

const paragraph = (...content: JSONContent[]): JSONContent =>
  content.length ? { type: 'paragraph', content } : { type: 'paragraph' }

const listItem = (value: string): JSONContent => ({
  type: 'listItem',
  content: [paragraph(text(value))],
})

async function typeIntoEmptyEditor(keys: string): Promise<JSONContent[] | undefined> {
  const { editor } = await renderEditor({ extensions: [NotraKit] })
  await focusEnd(editor)
  await userEvent.keyboard(keys)
  return editor.getJSON().content
}

describe('Markdown shortcuts', () => {
  const blockShortcuts: Array<[string, JSONContent[]]> = [
    ['# Title', [{ type: 'heading', attrs: { level: 1 }, content: [text('Title')] }]],
    ['## Title', [{ type: 'heading', attrs: { level: 2 }, content: [text('Title')] }]],
    ['### Title', [{ type: 'heading', attrs: { level: 3 }, content: [text('Title')] }]],
    ['- item', [{ type: 'bulletList', content: [listItem('item')] }]],
    ['* item', [{ type: 'bulletList', content: [listItem('item')] }]],
    [
      '1. item',
      [{ type: 'orderedList', attrs: { start: 1, type: null }, content: [listItem('item')] }],
    ],
    ['> quote', [{ type: 'blockquote', content: [paragraph(text('quote'))] }]],
    ['``` code', [{ type: 'codeBlock', attrs: { language: null }, content: [text('code')] }]],
    ['---', [{ type: 'horizontalRule' }, paragraph()]],
  ]

  it.each(blockShortcuts)('turns %j into the matching block', async (keys, expected) => {
    expect(await typeIntoEmptyEditor(keys)).toEqual(expected)
  })

  const markShortcuts: Array<[string, string]> = [
    ['**text**', 'bold'],
    ['*text*', 'italic'],
    ['~~text~~', 'strike'],
    ['`text`', 'code'],
  ]

  it.each(markShortcuts)('turns %j into text marked %s', async (keys, mark) => {
    expect(await typeIntoEmptyEditor(keys)).toEqual([paragraph(text('text', [mark]))])
  })
})

describe('keyboard commands', () => {
  it('toggles underline on the selected text with Mod+U', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: { type: 'doc', content: [paragraph(text('text'))] },
    })
    await focusEditor(editor, { from: 1, to: 5 })

    await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}')
    expect(editor.getJSON().content).toEqual([paragraph(text('text', ['underline']))])

    await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}')
    expect(editor.getJSON().content).toEqual([paragraph(text('text'))])
  })

  it('undoes the latest change with Mod+Z and redoes it with Mod+Shift+Z', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: { type: 'doc', content: [paragraph(text('Kept'))] },
    })
    await focusEnd(editor)
    await userEvent.keyboard(' added')
    expect(editor.getJSON().content).toEqual([paragraph(text('Kept added'))])

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}')
    expect(editor.getJSON().content).toEqual([paragraph(text('Kept'))])

    await userEvent.keyboard('{ControlOrMeta>}{Shift>}z{/Shift}{/ControlOrMeta}')
    expect(editor.getJSON().content).toEqual([paragraph(text('Kept added'))])
  })
})
