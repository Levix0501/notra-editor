import type { Editor, FocusPosition } from '@tiptap/core'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { NotraEditor, type NotraEditorRootProps, useNotraEditor } from '../../src'

interface Mounted {
  root: Root
  container: HTMLElement
}

const mounted = new Set<Mounted>()

export interface RenderResult {
  container: HTMLElement
  rerender: (ui: ReactNode) => Promise<void>
  unmount: () => Promise<void>
}

/** Renders `ui` into a new container attached to the document. */
export async function render(ui: ReactNode): Promise<RenderResult> {
  const container = document.createElement('div')
  document.body.append(container)
  const entry: Mounted = { root: createRoot(container), container }
  mounted.add(entry)
  await act(async () => {
    entry.root.render(ui)
  })
  return {
    container,
    rerender: async (next) => {
      await act(async () => {
        entry.root.render(next)
      })
    },
    unmount: async () => {
      await unmountEntry(entry)
    },
  }
}

async function unmountEntry(entry: Mounted): Promise<void> {
  if (!mounted.delete(entry)) return
  await act(async () => {
    entry.root.unmount()
  })
  entry.container.remove()
}

/** Unmounts everything that `render` mounted. */
export async function cleanup(): Promise<void> {
  for (const entry of [...mounted]) await unmountEntry(entry)
}

function EditorProbe({ onEditor }: { onEditor: (editor: Editor) => void }): null {
  onEditor(useNotraEditor())
  return null
}

export interface EditorRenderResult extends RenderResult {
  /** The editor that the Root provided on its first render. */
  editor: Editor
  /** The editor that the Root provided on its latest render. */
  currentEditor: () => Editor
  /** The editable surface. */
  surface: HTMLElement
  /** Re-renders the Root with other props. */
  rerenderRoot: (props: NotraEditorRootProps) => Promise<void>
}

/** Renders `NotraEditor.Content` inside `NotraEditor.Root` and returns the editor. */
export async function renderEditor(
  props: NotraEditorRootProps = {},
  contentClassName?: string,
): Promise<EditorRenderResult> {
  let editor: Editor | undefined
  const onEditor = (current: Editor) => {
    editor = current
  }
  const tree = (rootProps: NotraEditorRootProps) => (
    <NotraEditor.Root {...rootProps}>
      <EditorProbe onEditor={onEditor} />
      <NotraEditor.Content className={contentClassName} />
    </NotraEditor.Root>
  )
  const result = await render(tree(props))
  if (!editor) throw new Error('NotraEditor.Root did not create an editor')
  const surface = result.container.querySelector<HTMLElement>('[contenteditable="true"]')
  if (!surface) throw new Error('NotraEditor.Content did not render an editable surface')
  const first = editor
  return {
    ...result,
    editor: first,
    currentEditor: () => editor ?? first,
    surface,
    rerenderRoot: (next) => result.rerender(tree(next)),
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Moves the selection to `position` (the end of the document by default) and waits until the
 * editable surface has the focus, which Tiptap gives it on the next animation frame.
 */
export async function focusEditor(
  editor: Editor,
  position: FocusPosition | { from: number; to: number } = 'end',
): Promise<void> {
  await act(async () => {
    if (typeof position === 'object' && position !== null) {
      editor.chain().setTextSelection(position).focus().run()
    } else {
      editor.commands.focus(position)
    }
    await nextFrame()
    await nextFrame()
  })
  if (!editor.view.hasFocus()) throw new Error('The editable surface did not receive the focus')
}

/** Places the cursor at the end of the document and focuses the editable surface. */
export function focusEnd(editor: Editor): Promise<void> {
  return focusEditor(editor, 'end')
}

/** Dispatches a paste event carrying the given clipboard data to the editable surface. */
export async function paste(target: HTMLElement, data: Record<string, string>): Promise<void> {
  const clipboardData = new DataTransfer()
  for (const [type, value] of Object.entries(data)) clipboardData.setData(type, value)
  await act(async () => {
    target.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    )
  })
}

/** Returns the text that CSS generates for `element`'s `::before` pseudo-element. */
export function beforeContent(element: Element): string | null {
  const content = getComputedStyle(element, '::before').content
  if (content === 'none' || content === 'normal' || content === '') return null
  return JSON.parse(content)
}

/** Every text that `root` renders or exposes as an accessible name or description. */
export function exposedTexts(root: HTMLElement): string[] {
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
