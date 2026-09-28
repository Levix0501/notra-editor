'use client'

import type { Editor } from '@tiptap/core'
import { type Context, createContext, useContext } from 'react'
import { getEditorMessages, type NotraMessages } from './messages'

/** Carries the editor that the nearest `NotraEditor.Root` created. */
export const NotraEditorContext: Context<Editor | null> = createContext<Editor | null>(null)

/** Carries the active built-in strings of the nearest `NotraEditor.Root`. */
export const NotraMessagesContext: Context<NotraMessages | null> =
  createContext<NotraMessages | null>(null)

/**
 * Returns the editor of the nearest `NotraEditor.Root`.
 *
 * @throws When called outside `NotraEditor.Root`.
 */
export function useNotraEditor(): Editor {
  const editor = useContext(NotraEditorContext)
  if (!editor) {
    throw new Error('useNotraEditor() must be called inside <NotraEditor.Root>.')
  }
  return editor
}

/**
 * Returns the active built-in strings of the nearest `NotraEditor.Root`, and re-renders the
 * caller when its `locale` or `messages` change.
 *
 * @throws When called outside `NotraEditor.Root`.
 */
export function useNotraMessages(): NotraMessages {
  const editor = useNotraEditor()
  return useContext(NotraMessagesContext) ?? getEditorMessages(editor)
}
