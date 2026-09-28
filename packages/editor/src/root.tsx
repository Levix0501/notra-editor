'use client'

import type { EditorEvents, Extensions, JSONContent } from '@tiptap/core'
import type { EditorProps } from '@tiptap/pm/view'
import { EditorContext, useEditor } from '@tiptap/react'
import {
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { withBaseNodes } from './base-nodes'
import { NotraEditorContext, NotraMessagesContext } from './context'
import {
  bindEditorMessages,
  type NotraLocale,
  type NotraMessages,
  resolveMessages,
} from './messages'

/** Props of `NotraEditor.Root`. */
export interface NotraEditorRootProps {
  /**
   * The Tiptap extensions to install, usually `[NotraKit]` plus your own. The `doc`,
   * `paragraph` and `text` nodes are added when the list lacks them. Read once, when the editor
   * is created.
   */
  extensions?: Extensions
  /** The initial document in Tiptap JSON. Read once, when the editor is created. */
  initialContent?: JSONContent
  /** Called after every change to the document. */
  onUpdate?: (props: EditorEvents['update']) => void
  /** Locale of the built-in strings. Defaults to `en`. */
  locale?: NotraLocale
  /** Overrides for any subset of the active locale's built-in strings. */
  messages?: Partial<NotraMessages>
  /** Content rendered once the editor exists, such as `NotraEditor.Content`. */
  children?: ReactNode
}

function editableAttributes(messages: NotraMessages): Record<string, string> {
  return {
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': messages.editorLabel,
  }
}

/**
 * Creates one Tiptap editor and provides it to its descendants through `useNotraEditor()` and
 * Tiptap's `EditorContext`. The editor is created in the browser after mounting; until then,
 * including during server rendering, the children are not rendered.
 */
export function Root({
  extensions,
  initialContent,
  onUpdate,
  locale = 'en',
  messages,
  children,
}: NotraEditorRootProps): ReactElement | null {
  const signature = JSON.stringify(resolveMessages(locale, messages))
  const currentMessages = useMemo<NotraMessages>(() => JSON.parse(signature), [signature])
  const messagesRef = useRef(currentMessages)

  // The editor is configured once. These options keep their identity across renders, so that
  // Tiptap neither reconfigures nor recreates the editor when this component re-renders.
  const [options] = useState(() => {
    const editorProps: EditorProps = { attributes: editableAttributes(currentMessages) }
    return {
      editorProps,
      extensions: withBaseNodes(extensions ?? []),
      ...(initialContent === undefined ? {} : { content: initialContent }),
    }
  })

  const editor = useEditor({
    ...options,
    injectCSS: false,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    onBeforeCreate: ({ editor: created }) => {
      bindEditorMessages(created, () => messagesRef.current)
    },
    onUpdate,
  })

  useLayoutEffect(() => {
    if (messagesRef.current === currentMessages) return
    messagesRef.current = currentMessages
    // Update the attributes in place: Tiptap reapplies this object whenever it updates its
    // options, and an editor created later starts from it.
    const attributes = editableAttributes(currentMessages)
    options.editorProps.attributes = attributes
    if (!editor || editor.isDestroyed) return
    // Re-render the view so that its attributes and its placeholder show the new strings.
    editor.view.setProps({ attributes })
  }, [editor, currentMessages, options])

  const tiptapContext = useMemo(() => ({ editor }), [editor])

  if (!editor) return null

  return (
    <EditorContext value={tiptapContext}>
      <NotraEditorContext value={editor}>
        <NotraMessagesContext value={currentMessages}>{children}</NotraMessagesContext>
      </NotraEditorContext>
    </EditorContext>
  )
}
