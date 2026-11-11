import type { JSONContent, MarkdownRendererHelpers, RenderContext } from "@tiptap/core"
import { ListItem, OrderedList, TaskItem, TaskList } from "@tiptap/extension-list"

import { interruptsParagraph, LIST_MARKER } from "./markdown/list-markers"

/** Text of empty nested items, which Markdown would not keep otherwise (like Tiptap). */
const EMPTY_ITEM_TEXT = "&nbsp;"

/**
 * Whether a block can be written on the line of the marker, in an item that
 * starts with it. `- ---` would be a divider instead of an item.
 */
function canStartItem(node: JSONContent): boolean {
  return node.type === "orderedList" || interruptsParagraph(node)
}

/** The bullet or delimiter of the items of a list, see `separateLists`. */
function getMarker(context: RenderContext, standard: string): string {
  const marker = context.meta?.parentAttrs?.[LIST_MARKER]
  return typeof marker === "string" ? marker : standard
}

/**
 * Writes a list item: the marker with the first paragraph, followed by the
 * other blocks of the item, indented to the content of the item. Unlike
 * Tiptap, the continuation lines of the first paragraph are indented too,
 * and blank lines inside of the item stay empty. A block follows the block
 * before it on the next line when Markdown reads it there (a nested list),
 * and after a blank line otherwise.
 */
function renderListItem(
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
  context: RenderContext,
  marker: string,
  checkbox = "",
): string {
  const indent = " ".repeat(marker.length)
  const indentLines = (text: string, from: number) =>
    text
      .split("\n")
      .map((line, index) => (index < from || !line ? line : indent + line))
      .join("\n")

  const [first, ...rest] = node.content ?? []
  // Some blocks are written with line breaks around them (tables), which would be blank lines here.
  const render = (child: JSONContent, index: number) =>
    (helpers.renderChild?.(child, index) ?? helpers.renderChildren([child])).replace(/^\n+|\n+$/g, "")
  let main = first ? helpers.renderChildren([first]) : ""
  let from = 1
  // An item that starts with another block than text (`- > quote`, `- ```js`)
  // starts with an empty paragraph in the editor: the block follows the marker.
  const [second] = rest
  if (!main && !checkbox && second && canStartItem(second)) {
    main = render(second, 1)
    from = 2
  }
  if (!main && !checkbox && context.level > 1) {
    main = EMPTY_ITEM_TEXT
  }
  // Without text, the next block starts on the next line: `-` and the block, indented.
  let output = main || checkbox || from > 1 ? `${marker}${checkbox}${indentLines(main, 1)}` : marker.trimEnd()
  rest.slice(from - 1).forEach((child, index) => {
    const content = render(child, index + from)
    const follows = output === marker.trimEnd() || (child.type !== "paragraph" && interruptsParagraph(child))
    output += `${follows ? "\n" : "\n\n"}${indentLines(content, 0)}`
  })
  return output
}

/**
 * Ordered lists, read by marked like by other CommonMark implementations
 * (see `ListSyntax`). Tiptap's own tokenizer for ordered lists is not used:
 * it drops items that are indented less than the first one (` 9.` followed
 * by `10.`), adds a space to the code in items on every read, and reads
 * paragraphs that start like `A. ` or `Dr. ` as lists.
 */
export const NotraOrderedList = OrderedList.extend({
  // `null` removes the tokenizer and the reader of the parent extension (`undefined` would inherit them).
  markdownTokenizer: null as unknown as undefined,
  parseMarkdown: null as unknown as undefined,
})

/**
 * Task lists, read by marked like other lists (see `ListSyntax`). Tiptap's
 * tokenizer and reader of task lists are not used: they take the text of an
 * item from the first line of its source, and Tiptap splits lists with tasks
 * in the same way when a reader of task lists exists.
 */
export const NotraTaskList = TaskList.extend({
  markdownTokenizer: null as unknown as undefined,
  parseMarkdown: null as unknown as undefined,
})

/** List items of bullet and ordered lists. Ordered lists always use numbers in Markdown. */
export const NotraListItem = ListItem.extend({
  renderMarkdown(node, helpers, context) {
    if (context.parentType !== "orderedList") {
      return renderListItem(node, helpers, context, `${getMarker(context, "-")} `)
    }
    const start = Number(context.meta?.parentAttrs?.start ?? 1)
    const number = (Number.isFinite(start) ? start : 1) + context.index
    return renderListItem(node, helpers, context, `${number}${getMarker(context, ".")} `)
  },
})

export const NotraTaskItem = TaskItem.extend({
  renderMarkdown(node, helpers, context) {
    const checkbox = node.attrs?.checked ? "[x] " : "[ ] "
    return renderListItem(node, helpers, context, `${getMarker(context, "-")} `, checkbox)
  },
})
