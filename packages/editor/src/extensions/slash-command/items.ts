import type { Editor, Range } from "@tiptap/core"
import { ImageIcon, MinusIcon, Table2Icon } from "lucide-react"
import type { ComponentType } from "react"

import { type BlockTypeId, blockTypes, isBlockTypeAvailable } from "#blocks/block-types.ts"
import type { NotraDictionary } from "#i18n/dictionary.ts"
import { getNotraStorage } from "../notra-core"

export type SlashCommandGroup = "basic" | "media" | "advanced"

export interface SlashCommandItem {
  /** Unique identifier of the item. */
  id: string
  /** Group the item is listed under when no query is typed. */
  group: SlashCommandGroup
  icon: ComponentType<{ className?: string }>
  title: string
  /** Additional search terms (matched case-insensitively). */
  keywords?: string[]
  /** Hint shown next to the item, e.g. the Markdown shortcut. */
  hint?: string
  /** Runs the command. `range` covers the typed `/query` text. */
  run: (props: { editor: Editor; range: Range }) => void
}

const BLOCK_KEYWORDS: Record<BlockTypeId, string[]> = {
  paragraph: ["text", "paragraph", "plain", "p"],
  heading1: ["h1", "heading", "title", "big"],
  heading2: ["h2", "heading", "subtitle", "medium"],
  heading3: ["h3", "heading", "subheading", "small"],
  bulletList: ["ul", "bullet", "unordered", "list", "-"],
  orderedList: ["ol", "numbered", "ordered", "list", "1."],
  taskList: ["todo", "to-do", "task", "checkbox", "check", "[]"],
  toggle: ["toggle", "details", "collapse", "collapsible", "fold"],
  blockquote: ["quote", "blockquote", "citation", ">"],
  callout: ["callout", "alert", "admonition", "note", "tip", "warning", "info"],
  codeBlock: ["code", "codeblock", "snippet", "pre", "```"],
}

const BLOCK_GROUPS: Record<BlockTypeId, SlashCommandGroup> = {
  paragraph: "basic",
  heading1: "basic",
  heading2: "basic",
  heading3: "basic",
  bulletList: "basic",
  orderedList: "basic",
  taskList: "basic",
  toggle: "basic",
  blockquote: "basic",
  callout: "basic",
  codeBlock: "advanced",
}

/**
 * Builds the default slash command items, localized with `dictionary`. With an
 * `editor`, only the items whose blocks the editor supports are returned.
 */
export function createDefaultSlashCommands(dictionary: NotraDictionary, editor?: Editor): SlashCommandItem[] {
  const isAvailable = (...nodes: string[]) => !editor || nodes.every((name) => editor.schema.nodes[name] !== undefined)

  const available = editor ? blockTypes.filter((blockType) => isBlockTypeAvailable(editor, blockType)) : blockTypes
  const blockItems: SlashCommandItem[] = available.map((blockType) => ({
    id: blockType.id,
    group: BLOCK_GROUPS[blockType.id],
    icon: blockType.icon,
    title: dictionary.blocks[blockType.id],
    keywords: BLOCK_KEYWORDS[blockType.id],
    hint: blockType.shortcut,
    run: ({ editor, range }) => {
      blockType.convert(editor.chain().focus().deleteRange(range), editor).run()
    },
  }))

  const divider: SlashCommandItem = {
    id: "divider",
    group: "basic",
    icon: MinusIcon,
    title: dictionary.blocks.divider,
    keywords: ["divider", "hr", "horizontal", "rule", "line", "separator", "---"],
    hint: "---",
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  }

  const image: SlashCommandItem = {
    id: "image",
    group: "media",
    icon: ImageIcon,
    title: dictionary.blocks.image,
    keywords: ["image", "picture", "photo", "img", "media", "upload"],
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      getNotraStorage(editor).openImagePanel?.()
    },
  }

  const table: SlashCommandItem = {
    id: "table",
    group: "advanced",
    icon: Table2Icon,
    title: dictionary.blocks.table,
    keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
    run: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  }

  const basic = blockItems.filter((item) => item.group === "basic")
  const advanced = blockItems.filter((item) => item.group === "advanced")

  return [
    ...basic,
    ...(isAvailable("horizontalRule") ? [divider] : []),
    ...(isAvailable("image") ? [image] : []),
    ...advanced,
    ...(isAvailable("table", "tableRow", "tableCell") ? [table] : []),
  ]
}

function scoreItem(item: SlashCommandItem, query: string): number {
  const title = item.title.toLowerCase()
  const keywords = item.keywords?.map((keyword) => keyword.toLowerCase()) ?? []
  const id = item.id.toLowerCase()

  if (title === query || id === query) return 5
  if (title.startsWith(query)) return 4
  if (keywords.some((keyword) => keyword.startsWith(query))) return 3
  if (title.includes(query) || id.includes(query)) return 2
  if (keywords.some((keyword) => keyword.includes(query))) return 1
  return 0
}

/**
 * Filters and ranks slash command items for a query. Items keep their
 * original order when they match equally well.
 */
export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return items
  }

  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, normalized) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item)
}
