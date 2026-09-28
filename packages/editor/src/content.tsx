'use client'

import { EditorContent } from '@tiptap/react'
import type { HTMLAttributes, ReactElement, Ref } from 'react'
import { useNotraEditor } from './context'
import { contentClassName } from './styles'
import { cn } from './utils/cn'

/** Props of `NotraEditor.Content`. */
export interface NotraEditorContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'contentEditable'> {
  /** Classes combined with the default classes; conflicting default classes are dropped. */
  className?: string
  ref?: Ref<HTMLDivElement>
}

/** Renders the editable surface of the editor of the enclosing `NotraEditor.Root`. */
export function Content({ className, ...props }: NotraEditorContentProps): ReactElement {
  const editor = useNotraEditor()
  return <EditorContent {...props} editor={editor} className={cn(contentClassName, className)} />
}
