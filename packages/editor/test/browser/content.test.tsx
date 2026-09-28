import type { EditorEvents, JSONContent } from '@tiptap/core'
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraKit } from '../../src'
import { focusEnd, renderEditor } from './render'

const initialDocument: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Plans' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Ship the ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'editor' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
        },
      ],
    },
  ],
}

const replacementDocument: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'K' }] }],
    },
    { type: 'horizontalRule' },
    { type: 'paragraph' },
  ],
}

describe('content contract', () => {
  it('starts from initialContent', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: initialDocument,
    })
    expect(editor.getJSON()).toEqual(initialDocument)
  })

  it('ignores later changes to initialContent', async () => {
    const { editor, currentEditor, rerenderRoot } = await renderEditor({
      extensions: [NotraKit],
      initialContent: initialDocument,
    })
    await rerenderRoot({ extensions: [NotraKit], initialContent: replacementDocument })
    expect(currentEditor()).toBe(editor)
    expect(currentEditor().getJSON()).toEqual(initialDocument)
  })

  it('reports every change through onUpdate', async () => {
    const updates: EditorEvents['update'][] = []
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: initialDocument,
      onUpdate: (props) => updates.push(props),
    })

    await focusEnd(editor)
    await userEvent.keyboard('x')

    expect(updates.length).toBeGreaterThan(0)
    const last = updates.at(-1)
    expect(last?.editor).toBe(editor)
    expect(JSON.stringify(last?.editor.getJSON())).toContain('onex')
  })

  it('calls the latest onUpdate after a re-render', async () => {
    const calls: string[] = []
    const { editor, currentEditor, rerenderRoot } = await renderEditor({
      extensions: [NotraKit],
      onUpdate: () => calls.push('first'),
    })
    await rerenderRoot({ extensions: [NotraKit], onUpdate: () => calls.push('second') })
    expect(currentEditor()).toBe(editor)

    await focusEnd(editor)
    await userEvent.keyboard('y')

    expect(calls.length).toBeGreaterThan(0)
    expect(new Set(calls)).toEqual(new Set(['second']))
  })

  it('lets the host replace the whole document with setContent', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit],
      initialContent: initialDocument,
    })
    await act(async () => {
      editor.commands.setContent(replacementDocument)
    })
    expect(editor.getJSON()).toEqual(replacementDocument)
  })
})
