'use client'

import { type ReactElement, type ReactNode, useLayoutEffect, useState } from 'react'
import { useNotraEditor, useNotraMessages } from '../context'
import { SlashMenuContext } from './context'
import { SlashMenuController } from './controller'
import { defaultSlashMenuItems } from './default-items'
import type { SlashMenuItem } from './types'

/** Props of `SlashMenu.Root`. */
export interface SlashMenuRootProps {
  /** The items that the menu offers, in this order. Defaults to `defaultSlashMenuItems`. */
  items?: readonly SlashMenuItem[]
  /** The menu's content, usually `SlashMenu.Content`. */
  children?: ReactNode
}

/**
 * Enables the slash menu of the enclosing `NotraEditor.Root`'s editor while it is rendered:
 * typing `/` at the start of a paragraph or heading, or after whitespace, opens the menu, and
 * the empty paragraph that holds the cursor shows a hint that points to it.
 */
export function Root({
  items = defaultSlashMenuItems,
  children,
}: SlashMenuRootProps): ReactElement {
  const editor = useNotraEditor()
  const messages = useNotraMessages()
  const [controller] = useState(() => new SlashMenuController(editor, { items, messages }))

  useLayoutEffect(() => {
    controller.update(items, messages)
  }, [controller, items, messages])

  useLayoutEffect(() => controller.attach(), [controller])

  return <SlashMenuContext value={controller}>{children}</SlashMenuContext>
}
