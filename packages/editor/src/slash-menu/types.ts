import type { Editor, JSONContent, Range } from '@tiptap/core'
import type { ReactNode } from 'react'
import type { NotraMessages } from '../messages'

/** A string, or a function that derives it from the active built-in strings. */
export type SlashMenuText = string | ((messages: NotraMessages) => string)

/** What the `command` of a slash menu item receives. */
export interface SlashMenuCommandProps {
  /** The editor of the enclosing `NotraEditor.Root`. */
  editor: Editor
  /**
   * The range of the typed `/` and the query after it, from the position directly before the
   * `/` to the position directly after the query.
   */
  range: Range
}

/** The fields that every slash menu item has. */
export interface SlashMenuItemBase {
  /** Identifies the item. */
  id: string
  /** The title that the menu shows and matches against the query. */
  title: SlashMenuText
  /** Further strings that the query is matched against. */
  keywords?: string[]
  /** An icon shown before the title. */
  icon?: ReactNode
  /** A short hint shown to the right of the title, such as a Markdown shortcut. */
  hint?: string
  /** The group under which the menu lists the item. */
  group?: SlashMenuText
}

/**
 * A slash menu item that inserts a block. When the block that holds the query contains nothing
 * else, the new block takes its place; otherwise it is inserted after that block.
 */
export interface SlashMenuBlockItem extends SlashMenuItemBase {
  /** The block to insert, in Tiptap JSON. */
  block: JSONContent
  command?: never
}

/** A slash menu item that runs its own command. */
export interface SlashMenuCommandItem extends SlashMenuItemBase {
  block?: never
  /**
   * Called when the item is selected. The menu leaves the document unchanged, so the command
   * decides what happens to the typed `/` and query.
   */
  command: (props: SlashMenuCommandProps) => void
}

/** An item of the slash menu: a plain object with either a `block` or a `command`. */
export type SlashMenuItem = SlashMenuBlockItem | SlashMenuCommandItem
