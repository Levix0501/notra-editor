'use client'

import {
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useContext,
} from 'react'
import { cn } from '../utils/cn'
import { SlashMenuItemContext, useSlashMenuController, useSlashMenuSnapshot } from './context'
import { resolveText } from './matching'
import {
  slashMenuItemClassName,
  slashMenuItemHintClassName,
  slashMenuItemIconClassName,
  slashMenuItemTitleClassName,
} from './styles'
import type { SlashMenuItem } from './types'

/** Props of `SlashMenu.Item`. */
export interface SlashMenuItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'id'> {
  /** The displayed item to render. */
  item: SlashMenuItem
  /** Classes combined with the default classes; conflicting default classes are dropped. */
  className?: string
  /** Content rendered instead of the item's icon, title and hint. */
  children?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/**
 * Renders a displayed item as an option of the menu: its icon, title and hint, or `children`
 * instead. Moving the pointer onto it highlights it, and clicking it selects it.
 */
export function Item({
  item,
  className,
  children,
  onClick,
  onPointerMove,
  ...props
}: SlashMenuItemProps): ReactElement | null {
  const controller = useSlashMenuController('Item')
  const snapshot = useSlashMenuSnapshot(controller)
  const entry = useContext(SlashMenuItemContext)
  const index = entry ? entry.index : snapshot.displayed.findIndex((shown) => shown.item === item)
  if (!snapshot.open || index < 0 || index >= snapshot.displayed.length) return null
  const highlighted = index === snapshot.highlighted
  // The title that the menu resolved while ranking the item, unless another item is passed.
  const title = entry?.item === item ? entry.title : resolveText(item.title, snapshot.messages)

  return (
    // The options of a listbox that the editor controls through aria-activedescendant are not
    // focusable, and the editor handles the keyboard for them.
    // biome-ignore lint/a11y/useFocusableInteractive: see above
    // biome-ignore lint/a11y/useKeyWithClickEvents: see above
    <div
      {...props}
      role="option"
      id={controller.optionId(index)}
      aria-selected={highlighted}
      data-slot="slash-menu-item"
      className={cn(slashMenuItemClassName, className)}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event)
        if (!highlighted) controller.highlight(index)
      }}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) controller.select(index)
      }}
    >
      {children ?? (
        <>
          {item.icon === undefined || item.icon === null || item.icon === false ? null : (
            <span
              aria-hidden="true"
              data-slot="slash-menu-item-icon"
              className={slashMenuItemIconClassName}
            >
              {item.icon}
            </span>
          )}
          <span data-slot="slash-menu-item-title" className={slashMenuItemTitleClassName}>
            {title}
          </span>
          {item.hint ? (
            <span data-slot="slash-menu-item-hint" className={slashMenuItemHintClassName}>
              {item.hint}
            </span>
          ) : null}
        </>
      )}
    </div>
  )
}
