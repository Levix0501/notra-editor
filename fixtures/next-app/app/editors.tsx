'use client'

import { NotraEditor, NotraKit } from '@notra/editor'
import type { JSONContent } from '@tiptap/core'
import { useState } from 'react'

const extensions = [NotraKit]

const sampleDocument: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Heading' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Text with ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
        { type: 'text', text: ', ' },
        { type: 'text', marks: [{ type: 'code' }], text: 'code' },
        { type: 'text', text: ' and a ' },
        {
          type: 'text',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          text: 'link',
        },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item' }] }],
        },
      ],
    },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote' }] }],
    },
    { type: 'codeBlock', content: [{ type: 'text', text: 'const answer = 42' }] },
    { type: 'horizontalRule' },
    { type: 'paragraph', content: [{ type: 'text', text: 'End' }] },
  ],
}

const emptyDocument: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

export function Editors() {
  const [updates, setUpdates] = useState(0)
  const countUpdate = () => setUpdates((count) => count + 1)

  return (
    <>
      <section data-testid="sample-editor">
        <NotraEditor.Root
          extensions={extensions}
          initialContent={sampleDocument}
          onUpdate={countUpdate}
        >
          <NotraEditor.Content />
        </NotraEditor.Root>
      </section>
      <section data-testid="empty-editor">
        <NotraEditor.Root
          extensions={extensions}
          initialContent={emptyDocument}
          onUpdate={countUpdate}
        >
          <NotraEditor.Content />
        </NotraEditor.Root>
      </section>
      <p data-testid="update-count">Updates: {updates}</p>
    </>
  )
}
