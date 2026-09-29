'use client'

import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react'
import { cn } from '../utils/cn'
import { SlashMenuItemContext, useSlashMenuController, useSlashMenuSnapshot } from './context'
import {
  slashMenuGroupClassName,
  slashMenuGroupHeadingClassName,
  slashMenuListClassName,
} from './styles'
import type { SlashMenuItem } from './types'

/** Props of `SlashMenu.List`. */
export interface SlashMenuListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'id'> {
  /** Classes combined with the default classes; conflicting default classes are dropped. */
  className?: string
  /** Renders one displayed item, usually as `<SlashMenu.Item item={item} />`. */
  children: (item: SlashMenuItem) => ReactNode
  ref?: Ref<HTMLDivElement>
}

/**
 * Renders the listbox of the displayed items, in sections that are headed by their group, and
 * renders each item with its child function.
 */
export function List({ className, children, ...props }: SlashMenuListProps): ReactElement | null {
  const controller = useSlashMenuController('List')
  const snapshot = useSlashMenuSnapshot(controller)
  if (!snapshot.open) return null

  const usedKeys = new Set<string>()
  const keyOf = (id: string) => {
    let key = `item:${id}`
    for (let suffix = 1; usedKeys.has(key); suffix += 1) key = `item:${id}:${suffix}`
    usedKeys.add(key)
    return key
  }

  return (
    <div
      {...props}
      role="listbox"
      id={controller.listboxId}
      aria-label={snapshot.messages.slashMenuLabel}
      data-slot="slash-menu-list"
      className={cn(slashMenuListClassName, className)}
    >
      {snapshot.sections.map((section, sectionIndex) => {
        const headingId = `${controller.listboxId}-group-${sectionIndex}`
        return (
          // A listbox groups its options in elements with the group role.
          // biome-ignore lint/a11y/useSemanticElements: see above
          <div
            key={section.key}
            role="group"
            aria-labelledby={section.heading === null ? undefined : headingId}
            data-slot="slash-menu-group"
            className={slashMenuGroupClassName}
          >
            {section.heading === null ? null : (
              <div
                id={headingId}
                aria-hidden="true"
                data-slot="slash-menu-group-heading"
                className={slashMenuGroupHeadingClassName}
              >
                {section.heading}
              </div>
            )}
            {section.items.map((entry) => (
              <SlashMenuItemContext key={keyOf(entry.item.id)} value={entry}>
                {children(entry.item)}
              </SlashMenuItemContext>
            ))}
          </div>
        )
      })}
    </div>
  )
}
