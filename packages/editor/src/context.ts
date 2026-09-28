'use client'

import type { Editor } from '@tiptap/core'
import { type Context, createContext, useContext } from 'react'

/** Carries the editor that the nearest `NotraEditor.Root` created. */
export const NotraEditorContext: Context<Editor | null> = createContext<Editor | null>(null)

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
