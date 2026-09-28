import type { Editor, JSONContent } from '@tiptap/core'
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraKit } from '../../src'
import { focusEnd, paste, renderEditor } from './render'

const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

async function run(editor: Editor, command: (editor: Editor) => void): Promise<void> {
  await act(async () => {
    command(editor)
  })
}

describe('schema', () => {
  const blocks: Array<[string, (editor: Editor) => void, JSONContent[]]> = [
    ['paragraph', () => {}, [paragraph('text')]],
    ...[1, 2, 3].map((level): [string, (editor: Editor) => void, JSONContent[]] => [
      `heading ${level}`,
      (editor) => editor.commands.setHeading({ level: level as 1 | 2 | 3 }),
      [{ type: 'heading', attrs: { level }, content: [{ type: 'text', text: 'text' }] }],
    ]),
    [
      'bullet list',
      (editor) => editor.commands.toggleBulletList(),
      [{ type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('text')] }] }],
    ],
    [
      'ordered list',
      (editor) => editor.commands.toggleOrderedList(),
      [
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [{ type: 'listItem', content: [paragraph('text')] }],
        },
      ],
    ],
    [
      'blockquote',
      (editor) => editor.commands.toggleBlockquote(),
      [{ type: 'blockquote', content: [paragraph('text')] }],
    ],
    [
      'code block',
      (editor) => editor.commands.toggleCodeBlock(),
      [{ type: 'codeBlock', attrs: { language: null }, content: [{ type: 'text', text: 'text' }] }],
    ],
    [
      'horizontal rule',
      (editor) => editor.chain().focus('end').setHorizontalRule().run(),
      [paragraph('text'), { type: 'horizontalRule' }, { type: 'paragraph' }],
    ],
  ]

  it.each(blocks)('represents a %s in Tiptap standard JSON', async (_name, command, expected) => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: { type: 'doc', content: [paragraph('text')] },
    })
    await run(editor, (current) => {
      current.commands.setTextSelection(1)
      command(current)
    })
    expect(editor.getJSON()).toEqual({ type: 'doc', content: expected })
  })

  const marks: Array<[string, (editor: Editor) => void, JSONContent]> = [
    ['bold', (editor) => editor.commands.toggleBold(), { type: 'bold' }],
    ['italic', (editor) => editor.commands.toggleItalic(), { type: 'italic' }],
    ['underline', (editor) => editor.commands.toggleUnderline(), { type: 'underline' }],
    ['strike', (editor) => editor.commands.toggleStrike(), { type: 'strike' }],
    ['code', (editor) => editor.commands.toggleCode(), { type: 'code' }],
    [
      'link',
      (editor) => editor.commands.setLink({ href: 'https://example.com/docs' }),
      {
        type: 'link',
        attrs: {
          href: 'https://example.com/docs',
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          class: null,
          title: null,
        },
      },
    ],
  ]

  it.each(marks)('represents %s text in Tiptap standard JSON', async (_name, command, mark) => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: { type: 'doc', content: [paragraph('text')] },
    })
    await run(editor, (current) => {
      current.commands.setTextSelection({ from: 1, to: 5 })
      command(current)
    })
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', marks: [mark], text: 'text' }] }],
    })
  })

  it('offers headings of levels 1 to 3 only', async () => {
    const { editor } = await renderEditor({ extensions: [NotraKit] })
    for (const level of [1, 2, 3] as const) expect(editor.can().setHeading({ level })).toBe(true)
    for (const level of [4, 5, 6] as const) expect(editor.can().setHeading({ level })).toBe(false)

    await focusEnd(editor)
    await userEvent.keyboard('#### deep')
    expect(editor.getJSON().content).toEqual([paragraph('#### deep')])
  })

  it('turns pasted h4 to h6 headings into level-3 headings', async () => {
    const { editor, surface } = await renderEditor({ extensions: [NotraKit] })
    await focusEnd(editor)
    await paste(surface, {
      'text/html': '<h4>A</h4><h5>B</h5><h6>C</h6>',
      'text/plain': 'A\nB\nC',
    })
    expect(editor.getJSON().content).toEqual(
      ['A', 'B', 'C'].map((text) => ({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text }],
      })),
    )
  })
})
