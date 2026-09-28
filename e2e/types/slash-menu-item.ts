/*
 * Type-level checks of the slash menu item type, as hosts see it through the package name.
 * `pnpm typecheck` compiles this module; nothing runs it.
 */
import type { NotraMessages, SlashMenuItem } from '@notra/editor'
import type { ReactElement } from 'react'

declare const icon: ReactElement

export const blockItem: SlashMenuItem = {
  id: 'paragraph',
  title: 'Paragraph',
  block: { type: 'paragraph' },
}

export const localizedItem: SlashMenuItem = {
  id: 'note',
  title: (messages: NotraMessages) => messages.blockText,
  group: (messages: NotraMessages) => messages.blockGroupBasic,
  keywords: ['note', 'remark'],
  icon,
  hint: '!',
  block: { type: 'blockquote', content: [{ type: 'paragraph' }] },
}

export const commandItem: SlashMenuItem = {
  id: 'remove',
  title: 'Remove',
  group: 'Actions',
  command: ({ editor, range }) => {
    editor.commands.deleteRange(range)
  },
}

// @ts-expect-error An item has either a block or a command, not both.
export const both: SlashMenuItem = {
  id: 'both',
  title: 'Both',
  block: { type: 'paragraph' },
  command: () => {},
}

// @ts-expect-error An item has a block or a command.
export const neither: SlashMenuItem = {
  id: 'neither',
  title: 'Neither',
}
