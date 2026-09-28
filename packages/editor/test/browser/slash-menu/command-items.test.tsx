import type { Editor, Range } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { commandItem, doc, expectOpen, paragraph, placeCursor, renderMenu, type } from './helpers'

describe('selecting a command item', () => {
  it('calls its command once with the editor and the query range, and changes nothing else', async () => {
    const calls: Array<{ editor: Editor; range: Range }> = []
    const { editor, currentEditor } = await renderMenu({
      items: [commandItem('Cmd', {}, calls)],
    })
    await placeCursor(editor, 'end')
    await type('/cm')
    await expectOpen(true)
    await type('{Enter}')
    await expectOpen(false)

    expect(calls).toHaveLength(1)
    const [call] = calls as [{ editor: Editor; range: Range }]
    expect(call.editor).toBe(currentEditor())
    expect(call.range.from).toBe(1)
    expect(editor.state.doc.textBetween(call.range.from, call.range.to)).toBe('/cm')
    expect(editor.getJSON()).toEqual(doc(paragraph('/cm')))
  })

  it('lets its command change the document', async () => {
    const { editor } = await renderMenu({
      items: [
        {
          id: 'clear',
          title: 'Remove query',
          command: ({ editor: target, range }) => {
            target.chain().deleteRange(range).insertContent('done').run()
          },
        },
      ],
    })
    await placeCursor(editor, 'end')
    await type('/rem{Enter}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('done')))
  })
})
