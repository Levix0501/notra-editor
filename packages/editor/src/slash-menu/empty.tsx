'use client'

import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react'
import { cn } from '../utils/cn'
import { useSlashMenuController, useSlashMenuSnapshot } from './context'
import { slashMenuEmptyClassName } from './styles'

/** Props of `SlashMenu.Empty`. */
export interface SlashMenuEmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Classes combined with the default classes; conflicting default classes are dropped. */
  className?: string
  /** Content rendered instead of the built-in no-results message. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/** Renders the no-results message, or `children`, while the open menu displays no item. */
export function Empty({ className, children, ...props }: SlashMenuEmptyProps): ReactElement | null {
  const controller = useSlashMenuController('Empty')
  const snapshot = useSlashMenuSnapshot(controller)
  if (!snapshot.open || snapshot.displayed.length > 0) return null
  return (
    <div {...props} data-slot="slash-menu-empty" className={cn(slashMenuEmptyClassName, className)}>
      {children ?? snapshot.messages.slashMenuEmpty}
    </div>
  )
}
