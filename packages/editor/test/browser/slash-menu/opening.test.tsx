import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import {
  blockquote,
  bulletList,
  codeBlock,
  doc,
  expectOpen,
  heading,
  isOpen,
  listItem,
  paragraph,
  placeCursor,
  renderMenu,
  run,
  text,
  type,
} from './helpers'

interface Position {
  name: string
  content: JSONContent
  /** The document position at which `/` is typed. */
  cursor: number
}

const opening: Position[] = [
  { name: 'in an empty paragraph', content: doc(paragraph()), cursor: 1 },
  { name: 'at the start of a paragraph abc', content: doc(paragraph('abc')), cursor: 1 },
  { name: 'after abc and a space', content: doc(paragraph('abc ')), cursor: 5 },
  { name: 'after abc and U+3000', content: doc(paragraph('abc\u3000')), cursor: 5 },
  { name: 'at the start of an empty heading', content: doc(heading(1)), cursor: 1 },
  {
    name: 'in an empty paragraph inside a bullet list item',
    content: doc(bulletList(listItem(paragraph()))),
    cursor: 3,
  },
  {
    name: 'in an empty paragraph inside a blockquote',
    content: doc(blockquote(paragraph())),
    cursor: 2,
  },
]

const staying: Array<Position & { keys?: string }> = [
  { name: 'directly after abc', content: doc(paragraph('abc')), cursor: 4 },
  { name: 'directly after 你好', content: doc(paragraph('你好')), cursor: 3 },
  { name: 'at the start of an empty code block', content: doc(codeBlock()), cursor: 1 },
  {
    name: 'after a space within inline code',
    content: doc({ type: 'paragraph', content: [text('a ', ['code'])] }),
    cursor: 3,
  },
  { name: 'when ／ is typed', content: doc(paragraph()), cursor: 1, keys: '／' },
  { name: 'when 、 is typed', content: doc(paragraph()), cursor: 1, keys: '、' },
]

describe('opening the slash menu', () => {
  it.each(opening)('opens when / is typed $name', async ({ content, cursor }) => {
    const { editor } = await renderMenu({ initialContent: content })
    await placeCursor(editor, cursor)
    await type('/')
    await expectOpen(true)
  })

  it.each(staying)('stays closed $name', async ({ content, cursor, keys = '/' }) => {
    const { editor } = await renderMenu({ initialContent: content })
    await placeCursor(editor, cursor)
    await type(keys)

    expect(editor.getText()).toContain(keys)
    expect(isOpen()).toBe(false)
    if (keys === '/') {
      const typedSlash = editor.state.doc.resolve(cursor + 1).nodeBefore
      expect(typedSlash?.text?.endsWith('/')).toBe(true)
      // The slash within inline code is marked as inline code too.
      if (content.content?.[0]?.content?.[0]?.marks) {
        expect(typedSlash?.marks.map((mark) => mark.type.name)).toEqual(['code'])
      }
    }
  })

  it('stays closed when / is inserted while the editor is not editable', async () => {
    const { editor } = await renderMenu()
    await placeCursor(editor, 'end')
    await run(() => {
      editor.setEditable(false)
      editor.commands.insertContent('/')
    })
    expect(editor.getText()).toBe('/')
    expect(isOpen()).toBe(false)
  })
})
