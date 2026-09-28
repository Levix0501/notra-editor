import type { Editor } from '@tiptap/core'
import { useCurrentEditor } from '@tiptap/react'
import { Component, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraEditor, NotraKit, useNotraEditor } from '../../src'
import { focusEnd, render, renderEditor } from './render'

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (error: unknown) => void },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: unknown): void {
    this.props.onError(error)
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}

function editableSurfaces(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll('[contenteditable="true"]')
}

describe('NotraEditor.Root', () => {
  it('provides the same editor through useNotraEditor() and useCurrentEditor() on the first render', async () => {
    const firstRenders: Array<{ notra: Editor | null; tiptap: Editor | null }> = []
    function Consumer() {
      const notra = useNotraEditor()
      const { editor: tiptap } = useCurrentEditor()
      if (firstRenders.length === 0) firstRenders.push({ notra, tiptap })
      return null
    }

    await render(
      <NotraEditor.Root extensions={[NotraKit]}>
        <Consumer />
      </NotraEditor.Root>,
    )

    expect(firstRenders).toHaveLength(1)
    const [{ notra, tiptap }] = firstRenders as [{ notra: Editor | null; tiptap: Editor | null }]
    expect(notra).not.toBeNull()
    expect(notra).toBeDefined()
    expect(tiptap).toBe(notra)
  })

  it('renders none of its children during server rendering', () => {
    const html = renderToString(
      <main>
        <NotraEditor.Root extensions={[NotraKit]}>
          <p id="child">child</p>
          <NotraEditor.Content />
        </NotraEditor.Root>
      </main>,
    )
    expect(html).toBe('<main></main>')
  })

  it('renders no editable surface without NotraEditor.Content', async () => {
    const { container } = await render(
      <NotraEditor.Root extensions={[NotraKit]}>
        <p>child</p>
      </NotraEditor.Root>,
    )
    expect(container.textContent).toBe('child')
    expect(editableSurfaces(container)).toHaveLength(0)
  })
})

describe('NotraEditor.Content', () => {
  it('renders exactly one editable surface whose typed text reaches the editor', async () => {
    const { container, editor, surface } = await renderEditor({ extensions: [NotraKit] })
    expect(editableSurfaces(container)).toHaveLength(1)
    expect(surface.closest('[contenteditable="true"]')).toBe(surface)

    await focusEnd(editor)
    await userEvent.keyboard('Hello')

    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    })
  })

  it('renders no editable surface outside NotraEditor.Root', async () => {
    const errors: unknown[] = []
    const { container } = await render(
      <ErrorBoundary onError={(error) => errors.push(error)}>
        <NotraEditor.Content />
      </ErrorBoundary>,
    )
    expect(editableSurfaces(container)).toHaveLength(0)
    expect(String(errors[0])).toContain('NotraEditor.Root')
  })
})

describe('useNotraEditor', () => {
  it('throws an error naming NotraEditor.Root outside any Root', async () => {
    function Outside() {
      useNotraEditor()
      return null
    }
    expect(() => renderToString(<Outside />)).toThrow('NotraEditor.Root')

    const errors: unknown[] = []
    await render(
      <ErrorBoundary onError={(error) => errors.push(error)}>
        <Outside />
      </ErrorBoundary>,
    )
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toContain('NotraEditor.Root')
  })
})
