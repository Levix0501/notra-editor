import type { JSONContent } from '@tiptap/core'

type Mark = NonNullable<JSONContent['marks']>[number]

const text = (value: string, ...marks: Mark[]): JSONContent =>
  marks.length ? { type: 'text', text: value, marks } : { type: 'text', text: value }

const paragraph = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content })

const listItem = (...content: JSONContent[]): JSONContent => ({
  type: 'listItem',
  content: [paragraph(...content)],
})

/** A document that shows every block and mark of NotraKit. */
export const sampleDocument: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [text('Notra Editor')] },
    paragraph(
      text('A Notion-like editor with '),
      text('bold', { type: 'bold' }),
      text(', '),
      text('italic', { type: 'italic' }),
      text(', '),
      text('underlined', { type: 'underline' }),
      text(', '),
      text('struck', { type: 'strike' }),
      text(' and '),
      text('inline code', { type: 'code' }),
      text(' text, plus '),
      text('links', { type: 'link', attrs: { href: 'https://tiptap.dev' } }),
      text('.'),
    ),
    { type: 'heading', attrs: { level: 2 }, content: [text('Blocks')] },
    {
      type: 'bulletList',
      content: [listItem(text('Bullet lists')), listItem(text('with several items'))],
    },
    {
      type: 'orderedList',
      attrs: { start: 1 },
      content: [listItem(text('Ordered lists')), listItem(text('count their items'))],
    },
    { type: 'blockquote', content: [paragraph(text('Blockquotes set a passage apart.'))] },
    {
      type: 'codeBlock',
      attrs: { language: null },
      content: [text('const editor = useNotraEditor()')],
    },
    { type: 'horizontalRule' },
    { type: 'heading', attrs: { level: 3 }, content: [text('Markdown shortcuts')] },
    paragraph(
      text(
        'Type # for a heading, - for a list, > for a quote, ``` for code and --- for a divider.',
      ),
    ),
  ],
}
