import { Extension, type JSONContent } from "@tiptap/core"

/**
 * Writer-only attribute of a list: the bullet (`*`) or delimiter (`)`) it is
 * written with when it follows a list of its kind, see {@link separateLists}.
 */
export const LIST_MARKER = "notraMarker"

/**
 * Text of empty nested items, like Tiptap: below the text of its parent,
 * `-` alone would be read as the underline of a setext heading, and `1.` as
 * text of the parent (an empty item cannot interrupt a paragraph). Items
 * with only this text are read as empty items (see `ListSyntax`).
 */
export const EMPTY_ITEM_TEXT = "&nbsp;"

type ListKind = "bullet" | "ordered"

/** The marker a kind of list is written with, and the one of a list that follows a list with it. */
const MARKERS: Readonly<Record<ListKind, readonly [standard: string, other: string]>> = {
  bullet: ["-", "*"],
  ordered: [".", ")"],
}

/** The kind of list a node is in Markdown: task lists are bullet lists. */
export function getListKind(type: string | undefined): ListKind | null {
  if (type === "orderedList") return "ordered"
  if (type === "bulletList" || type === "taskList") return "bullet"
  return null
}

/** The marker of a list that follows a list written with `marker`. */
export function getOtherMarker(marker: string): string {
  if (marker === "." || marker === ")") return marker === "." ? ")" : "."
  return marker === "-" ? "*" : "-"
}

function isEmptyParagraph(node: JSONContent): boolean {
  return node.type === "paragraph" && !node.content?.length
}

/**
 * Markdown reads two lists of the same kind as one list when only blank lines
 * separate them (empty paragraphs are blank lines): the items of the second
 * list would continue the first one. A bullet or delimiter that changes
 * starts a new list, so a list that follows a list of its kind is written
 * with the other marker (`*` after `-`, `)` after `.`), like remark does.
 * Returns the content with the markers as writer-only attributes.
 */
export function separateLists(node: JSONContent): JSONContent {
  if (!node.content?.length) {
    return node
  }
  let previous: { kind: ListKind; marker: string } | null = null
  let changed = false
  const content = node.content.map((child) => {
    let result = separateLists(child)
    const kind = getListKind(child.type)
    if (kind) {
      const [standard, other] = MARKERS[kind]
      const marker = previous?.kind === kind && previous.marker === standard ? other : standard
      previous = { kind, marker }
      if (marker !== standard) {
        result = { ...result, attrs: { ...result.attrs, [LIST_MARKER]: marker } }
      }
    } else if (!isEmptyParagraph(child)) {
      previous = null
    }
    changed ||= result !== child
    return result
  })
  return changed ? { ...node, content } : node
}

/**
 * Whether a block can directly follow the line of a paragraph, without a
 * blank line between them, and still be read as the block. Other blocks
 * would continue the paragraph (an image, an ordered list that does not
 * start at 1), turn it into a heading (`---` under text) or be taken in by
 * the last item of a list before them.
 */
export function interruptsParagraph(node: JSONContent): boolean {
  switch (node.type) {
    case "heading":
    case "codeBlock":
    case "blockquote":
    case "callout":
    case "details":
    case "bulletList":
    case "taskList":
      return true
    case "orderedList":
      return Number(node.attrs?.start ?? 1) === 1
    default:
      return false
  }
}

/**
 * Writes the lists of every Markdown document apart from the lists before
 * them, see {@link separateLists}.
 */
export const ListMarkers = Extension.create({
  name: "notraListMarkers",

  // After the Markdown extension, which creates the Markdown manager in `onBeforeCreate`.
  priority: 90,

  onBeforeCreate() {
    const manager = this.editor.markdown
    if (!manager) {
      return
    }
    const serialize = manager.serialize.bind(manager)
    manager.serialize = (content) => serialize(separateLists(content))
  },
})
