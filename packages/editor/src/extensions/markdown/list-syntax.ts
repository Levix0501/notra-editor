import { Extension, type JSONContent, type MarkdownParseHelpers, type MarkdownToken } from "@tiptap/core"

import type { NotraMarkdownContext } from "./context"
import { trimTrailingLines } from "./raw-block"

interface ListSyntaxOptions {
  context: NotraMarkdownContext | null
}

/** A list the editor cannot represent, kept as a source block. */
function createSource(token: MarkdownToken, helpers: MarkdownParseHelpers): JSONContent[] {
  const source = trimTrailingLines(String(token.raw ?? ""))
  return source ? [helpers.createNode("rawBlock", { kind: "markdown" }, [helpers.createTextNode(source)])] : []
}

/**
 * Reads the blocks of a list item. In tight lists, marked gives paragraphs as
 * `text` tokens (every paragraph, not only the first one: text after a code
 * block is one too), and the checkbox of a task as a token of its own.
 */
function parseItem(item: MarkdownToken, helpers: MarkdownParseHelpers): JSONContent[] {
  const blocks: JSONContent[] = []
  for (const token of (item.tokens ?? []) as MarkdownToken[]) {
    if (token.type === "space" || token.type === "checkbox") {
      continue
    }
    if (token.type !== "text" && token.type !== "paragraph") {
      blocks.push(...helpers.parseChildren([token]))
      continue
    }
    const inline = ((token.tokens ?? []) as MarkdownToken[]).filter((child) => child.type !== "checkbox")
    const paragraph = helpers.parseChildren([{ ...token, type: "paragraph", tokens: inline }])
    // The text of an item stays text, also when it is only an image.
    const isText = blocks.length > 0 || paragraph[0]?.type === "paragraph"
    blocks.push(...(isText ? paragraph : [helpers.createNode("paragraph", undefined, helpers.parseInline(inline))]))
  }
  // Items of the editor start with a paragraph: an item that starts with another block (code, a heading) starts with an empty one.
  if (blocks[0]?.type !== "paragraph") {
    blocks.unshift(helpers.createNode("paragraph", undefined, []))
  }
  return blocks
}

/**
 * Reads lists from the list tokens of marked, which reads them like other
 * CommonMark implementations: bullet lists, ordered lists, and task lists
 * for task items (consecutive items of a kind form a list). Lists the editor
 * cannot represent, such as ordered lists with tasks or lists of disabled
 * features, are kept as source blocks.
 *
 * Tiptap reads the items of each kind of list in its own way, which loses
 * content: only the first paragraph of a tight item is read as a paragraph
 * (text after a code block in an item becomes invalid content), and the
 * text of a task item is taken from the first line of its source.
 */
export const ListSyntax = Extension.create<ListSyntaxOptions>({
  name: "notraListSyntax",

  // Read before the list extensions, which read list tokens like Tiptap.
  priority: 200,

  addOptions() {
    return { context: null }
  },

  markdownTokenName: "list",

  parseMarkdown(token, helpers) {
    const nodes = this.options.context?.schema?.nodes
    if (!nodes || token.type !== "list") {
      return []
    }
    const items = (token.items ?? []) as MarkdownToken[]

    if (token.ordered) {
      if (!nodes.orderedList || !nodes.listItem || items.some((item) => item.task)) {
        return createSource(token, helpers)
      }
      const start = Number(token.start)
      return helpers.createNode(
        "orderedList",
        Number.isInteger(start) && start !== 1 ? { start } : undefined,
        items.map((item) => helpers.createNode("listItem", undefined, parseItem(item, helpers))),
      )
    }

    const lists: JSONContent[] = []
    for (const item of items) {
      const [listType, itemType] = item.task ? ["taskList", "taskItem"] : ["bulletList", "listItem"]
      if (!nodes[listType] || !nodes[itemType]) {
        return createSource(token, helpers)
      }
      const attrs = item.task ? { checked: Boolean(item.checked) } : undefined
      const node = helpers.createNode(itemType, attrs, parseItem(item, helpers))
      const last = lists.at(-1)
      if (last?.type === listType) {
        last.content = [...(last.content ?? []), node]
      } else {
        lists.push(helpers.createNode(listType, undefined, [node]))
      }
    }
    return lists
  },
})
