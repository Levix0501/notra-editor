import { commands as coreCommands, type Editor, Extension, type JSONContent, type MarkdownToken } from "@tiptap/core"
import { extractAbsorbedBlankLines, type MarkdownManager } from "@tiptap/markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { UPDATE_CONTENT_META, type UpdateContentMeta } from "../update-content"
import type { NotraMarkdownContext } from "./context"
import { trimTrailingLines } from "./raw-block"

/**
 * Transaction meta with the Markdown that replaced the content (`null` when
 * the content was replaced with something else).
 */
const SOURCE_META = "notraMarkdownSource"

interface SourceRange {
  /** Start of the text in the (normalized) source. */
  start: number
  /** End of the text, without the line breaks that follow it. */
  end: number
}

interface SourceChild extends SourceRange {
  node: ProseMirrorNode
}

/** A top-level node of the document and the source it was read from. */
interface SourceBlock extends SourceRange {
  node: ProseMirrorNode
  /** List items or table rows, which are written back one by one. */
  children?: SourceChild[]
  list?: {
    /** Separator of new items: a line break, or a blank line in loose lists. */
    separator: string
    bullet?: string
    delimiter?: string
    numbers: number[]
  }
  table?: {
    columns: number
    /** The delimiter row (`| --- | --- |`). */
    delimiter: SourceRange
  }
}

interface SourceSnapshot {
  /** The source, with line breaks normalized to `\n`. */
  source: string
  lineEnding: "\n" | "\r\n"
  blocks: SourceBlock[]
  byNode: Map<ProseMirrorNode, number>
  byChild: Map<ProseMirrorNode, { block: number; index: number }>
  /** Blocks by their Markdown as written by the editor, computed when first needed. */
  byMarkdown: Map<string, number[]> | null
}

const sourceKey = new PluginKey<SourceSnapshot | null>("notraMarkdownSource")

function isEmptyParagraph(node: ProseMirrorNode | null | undefined): boolean {
  return node?.type.name === "paragraph" && node.content.size === 0
}

function trimLineBreaks(text: string): string {
  return text.replace(/\n+$/, "")
}

/** Writes nodes to Markdown on their own, without surrounding blank lines. */
function serialize(manager: MarkdownManager, content: JSONContent[]): string {
  return manager.serialize({ type: "doc", content }).replace(/^\n+|\n+$/g, "")
}

function getChildren(node: ProseMirrorNode): ProseMirrorNode[] {
  const children: ProseMirrorNode[] = []
  node.forEach((child) => {
    children.push(child)
  })
  return children
}

/** Splits text into lines with their offsets. */
function getLines(text: string, offset: number): SourceRange[] {
  const lines: SourceRange[] = []
  let start = 0
  for (const line of text.split("\n")) {
    lines.push({ start: offset + start, end: offset + start + line.length })
    start += line.length + 1
  }
  return lines
}

/** Finds list items and table rows in the source of a block. */
function addChildren(block: SourceBlock, token: MarkdownToken, source: string): void {
  const { node } = block
  const isList = ["bulletList", "orderedList", "taskList"].includes(node.type.name)

  if (token.type === "list" && isList && Array.isArray(token.items) && token.items.length === node.childCount) {
    const children: SourceChild[] = []
    let cursor = block.start
    for (const [index, item] of token.items.entries()) {
      const raw = String(item.raw ?? "")
      const start = source.indexOf(raw, cursor)
      if (start === -1 || start + raw.length > block.end + 1) {
        return
      }
      children.push({ node: node.child(index), start, end: start + trimLineBreaks(raw).length })
      cursor = start + raw.length
    }
    const markers = children.map((child) =>
      /^\s*(?:([*+-])|(\d{1,9})([.)]))/.exec(source.slice(child.start, child.end)),
    )
    block.children = children
    block.list = {
      separator: token.loose ? "\n\n" : "\n",
      bullet: markers[0]?.[1],
      delimiter: markers[0]?.[3],
      numbers: markers.map((marker) => Number(marker?.[2])).filter((number) => Number.isFinite(number)),
    }
    return
  }

  if (token.type === "table" && node.type.name === "table" && Array.isArray(token.rows)) {
    const [header, delimiter, ...rows] = getLines(source.slice(block.start, block.end), block.start)
    if (!header || !delimiter || rows.length !== token.rows.length || node.childCount !== rows.length + 1) {
      return
    }
    block.children = [header, ...rows].map((line, index) => ({ ...line, node: node.child(index) }))
    block.table = { columns: Array.isArray(token.header) ? token.header.length : 0, delimiter }
  }
}

/**
 * Reads where each top-level node of `doc` comes from in `source`. Every top
 * level token is parsed on its own and the result must be the document, so
 * that only exact matches are written back verbatim. Returns `null` when the
 * source cannot be matched.
 */
function createSnapshot(
  manager: MarkdownManager,
  context: NotraMarkdownContext,
  rawSource: string,
  doc: ProseMirrorNode,
): SourceSnapshot | null {
  const lineEnding = rawSource.includes("\r\n") ? "\r\n" : "\n"
  // marked normalizes line breaks the same way before reading the source.
  const source = rawSource.replace(/\r\n?/g, "\n")
  const lexer = new manager.instance.Lexer(manager.instance.defaults)
  const tokens = extractAbsorbedBlankLines(lexer.lex(source) as MarkdownToken[])

  const located: (SourceRange & { token: MarkdownToken })[] = []
  let cursor = 0
  for (const token of tokens) {
    const raw = String(token.raw ?? "")
    const start = source.startsWith(raw, cursor) ? cursor : source.indexOf(raw, cursor)
    if (start === -1) {
      return null
    }
    located.push({ token, start, end: start + raw.length })
    cursor = start + raw.length
  }

  // Reference links of a block need the definitions of the document.
  const definitions = located
    .filter(({ token }) => token.type === "def")
    .map(({ token }) => String(token.raw ?? "").trim())
    .join("\n")
  const firstContent = located.findIndex(({ token }) => token.type !== "space")
  const lastContent = located.findLastIndex(({ token }) => token.type !== "space")

  const entries: (SourceRange & { json: JSONContent; token: MarkdownToken | null })[] = []
  const keepDefinitions = context.keepDefinitions
  context.keepDefinitions = false
  try {
    for (const [index, { token, start, end }] of located.entries()) {
      if (token.type === "space") {
        // Blank lines become empty paragraphs, like Tiptap does: every blank
        // line beyond the first one between blocks, every one at the edges.
        // Each empty paragraph is placed after a blank line, so that edits
        // next to it keep the blank lines around it.
        const separators = Array.from(String(token.raw ?? "").matchAll(/\n\n/g), (match) => match.index)
        const atStart = firstContent === -1 || index < firstContent
        const isBoundary = atStart || index > lastContent
        const count = Math.max(separators.length - (isBoundary ? 0 : 1), 0)
        for (const separator of separators.slice(0, count)) {
          const offset = start + separator + (atStart ? 0 : 2)
          entries.push({ start: offset, end: offset, json: { type: "paragraph" }, token: null })
        }
      } else if (token.type === "def") {
        if (keepDefinitions) {
          const text = trimTrailingLines(String(token.raw ?? ""))
          entries.push({
            start,
            end: start + text.length,
            json: { type: "rawBlock", attrs: { kind: "definition" }, content: text ? [{ type: "text", text }] : [] },
            token,
          })
        }
      } else {
        const text = trimLineBreaks(source.slice(start, end))
        const parsed = manager.parse(definitions ? `${text}\n\n${definitions}` : text).content ?? []
        for (const json of parsed) {
          entries.push({ start, end: start + text.length, json, token: parsed.length === 1 ? token : null })
        }
      }
    }
  } finally {
    context.keepDefinitions = keepDefinitions
  }

  // The trailing node extension may have added an empty paragraph.
  const children = getChildren(doc)
  while (children.length > entries.length && isEmptyParagraph(children.at(-1))) {
    children.pop()
  }
  if (children.length !== entries.length) {
    return null
  }

  const blocks: SourceBlock[] = []
  try {
    for (const [index, entry] of entries.entries()) {
      const node = children[index]
      if (!node?.eq(doc.type.schema.nodeFromJSON(entry.json))) {
        return null
      }
      const block: SourceBlock = { node, start: entry.start, end: entry.end }
      if (entry.token) {
        addChildren(block, entry.token, source)
      }
      blocks.push(block)
    }
  } catch {
    return null
  }

  const byNode = new Map<ProseMirrorNode, number>()
  const byChild = new Map<ProseMirrorNode, { block: number; index: number }>()
  for (const [index, block] of blocks.entries()) {
    byNode.set(block.node, index)
    for (const [childIndex, child] of (block.children ?? []).entries()) {
      byChild.set(child.node, { block: index, index: childIndex })
    }
  }

  return { source, lineEnding, blocks, byNode, byChild, byMarkdown: null }
}

/** Writes a document to Markdown, reusing the source of unchanged blocks. */
class SourceWriter {
  private readonly markdown = new WeakMap<ProseMirrorNode, string>()
  private readonly manager: MarkdownManager
  private readonly snapshot: SourceSnapshot

  constructor(manager: MarkdownManager, snapshot: SourceSnapshot) {
    this.manager = manager
    this.snapshot = snapshot
  }

  private slice(range: SourceRange): string {
    return this.snapshot.source.slice(range.start, range.end)
  }

  /** The Markdown the editor writes for a top-level node (cached per node). */
  private toMarkdown(node: ProseMirrorNode): string {
    let markdown = this.markdown.get(node)
    if (markdown === undefined) {
      markdown = serialize(this.manager, [node.toJSON()])
      this.markdown.set(node, markdown)
    }
    return markdown
  }

  /** Finds the block an unchanged node comes from, preferring the one closest to `hint`. */
  private findBlock(node: ProseMirrorNode, hint: number): number | null {
    const index = this.snapshot.byNode.get(node)
    if (index !== undefined) {
      return index
    }
    // Nodes recreated without changes (undo, viewing state such as an open toggle).
    let byMarkdown = this.snapshot.byMarkdown
    if (!byMarkdown) {
      byMarkdown = new Map()
      for (const [blockIndex, block] of this.snapshot.blocks.entries()) {
        const markdown = this.toMarkdown(block.node)
        byMarkdown.set(markdown, [...(byMarkdown.get(markdown) ?? []), blockIndex])
      }
      this.snapshot.byMarkdown = byMarkdown
    }
    const candidates = byMarkdown.get(this.toMarkdown(node))
    if (!candidates?.length) {
      return null
    }
    return candidates.reduce((best, candidate) =>
      Math.abs(candidate - hint) < Math.abs(best - hint) ? candidate : best,
    )
  }

  /** Finds the list or table a changed node comes from, through its unchanged items or rows. */
  private findParent(node: ProseMirrorNode): number | null {
    for (const child of getChildren(node)) {
      const hit = this.snapshot.byChild.get(child)
      if (hit && this.snapshot.blocks[hit.block]?.node.type === node.type) {
        return hit.block
      }
    }
    return null
  }

  /**
   * Finds the item or row a child of a changed list or table comes from: the
   * same node, or one written the same (`key` of a current and an original child).
   */
  private findChild(
    block: SourceBlock,
    child: ProseMirrorNode,
    key: (child: ProseMirrorNode) => string,
    originalKey: (child: ProseMirrorNode) => string = key,
  ): number | null {
    const hit = this.snapshot.byChild.get(child)
    if (hit && this.snapshot.blocks[hit.block] === block) {
      return hit.index
    }
    const markdown = key(child)
    const index = block.children?.findIndex((original) => originalKey(original.node) === markdown) ?? -1
    return index === -1 ? null : index
  }

  /** Writes the items of a list, reusing the source of unchanged items. */
  private writeList(block: SourceBlock, node: ProseMirrorNode): string {
    const { children = [], list } = block
    const wrap = (item: ProseMirrorNode) =>
      serialize(this.manager, [{ type: node.type.name, attrs: node.attrs, content: [item.toJSON()] }])

    let output = ""
    let previous: number | null = null
    getChildren(node).forEach((item, index) => {
      const original = this.findChild(block, item, wrap)
      let text: string
      if (original !== null && children[original]) {
        text = this.slice(children[original])
      } else {
        text = wrap(item)
        // Keep the markers of the list: `*` or `+` bullets, `1)` delimiters, numbering.
        if (list?.bullet) {
          text = text.replace(/^(\s*)[-*+](?=\s|$)/, `$1${list.bullet}`)
        }
        if (list?.delimiter) {
          const numbers = list.numbers
          const repeated = numbers.length > 1 && numbers.every((number) => number === numbers[0])
          const number = repeated ? numbers[0] : (numbers[0] ?? 1) + index
          text = text.replace(/^(\s*)\d{1,9}[.)]/, `$1${number}${list.delimiter}`)
        }
      }
      const previousChild = previous === null ? undefined : children[previous]
      const currentChild = original === null ? undefined : children[original]
      const separator =
        previous !== null && previousChild && currentChild && original === previous + 1
          ? this.snapshot.source.slice(previousChild.end, currentChild.start)
          : (list?.separator ?? "\n")
      output += index === 0 ? text : separator + text
      previous = original
    })
    return output
  }

  /** Writes the rows of a table, reusing the source of unchanged rows. */
  private writeTable(block: SourceBlock, node: ProseMirrorNode): string | null {
    const { children = [], table } = block
    const header = node.firstChild
    const originalHeader = block.node.firstChild
    if (!table || !header || !originalHeader || header.childCount !== table.columns) {
      return null
    }
    // A row is written as the last line of a table made of the header row and the row.
    const writeRow = (row: ProseMirrorNode, headerRow: ProseMirrorNode) => {
      const rows = row === headerRow ? [row.toJSON()] : [headerRow.toJSON(), row.toJSON()]
      const lines = serialize(this.manager, [{ type: "table", content: rows }]).split("\n")
      return (row === headerRow ? lines[0] : lines.at(-1)) ?? ""
    }
    // Rows are compared without the padding that aligns the columns.
    const toKey = (line: string) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .join("|")

    const lines: string[] = []
    getChildren(node).forEach((row, index) => {
      const original = this.findChild(
        block,
        row,
        (current) => toKey(writeRow(current, header)),
        (originalRow) => toKey(writeRow(originalRow, originalHeader)),
      )
      lines.push(original !== null && children[original] ? this.slice(children[original]) : writeRow(row, header))
      if (index === 0) {
        lines.push(this.slice(table.delimiter))
      }
    })
    return lines.join("\n")
  }

  write(doc: ProseMirrorNode): string {
    const { blocks, source } = this.snapshot
    const nodes = getChildren(doc)
    // Empty paragraphs at the end are added by the trailing node extension.
    while (isEmptyParagraph(nodes.at(-1)) && !this.snapshot.byNode.has(nodes.at(-1) as ProseMirrorNode)) {
      nodes.pop()
    }

    let output = ""
    let previous: number | null = null
    nodes.forEach((node, index) => {
      const hint = previous === null ? index : previous + 1
      let block = this.findBlock(node, hint)
      let text: string | null = null

      if (block !== null) {
        text = this.slice(blocks[block] as SourceBlock)
      } else {
        block = this.findParent(node)
        const parent = block === null ? undefined : blocks[block]
        if (parent?.list) text = this.writeList(parent, node)
        else if (parent?.table) text = this.writeTable(parent, node)
        if (text === null) block = null
      }
      text ??= this.writeNode(node, index)

      if (index === 0) {
        output += block === 0 ? source.slice(0, blocks[0]?.start ?? 0) : ""
      } else {
        const adjacent = previous !== null && block === previous + 1
        output += adjacent
          ? source.slice(
              (blocks[previous as number] as SourceBlock).end,
              (blocks[block as number] as SourceBlock).start,
            )
          : "\n\n"
      }
      output += text
      previous = block
    })

    const last = blocks.at(-1)
    if (last && previous === blocks.length - 1) {
      output += source.slice(last.end)
    } else if (source.endsWith("\n")) {
      output += "\n"
    }

    return this.snapshot.lineEnding === "\r\n" ? output.replace(/\n/g, "\r\n") : output
  }

  private writeNode(node: ProseMirrorNode, index: number): string {
    // Front matter is only valid at the start of the document.
    if (node.type.name === "rawBlock" && node.attrs.kind === "frontmatter" && index > 0) {
      return serialize(this.manager, [{ type: "paragraph" }, node.toJSON()])
    }
    return this.toMarkdown(node)
  }
}

export interface MarkdownSourceOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
}

/**
 * Writes Markdown back with the source of unchanged blocks, list items and
 * table rows, so that saving a document only changes what was edited. Line
 * endings, blank lines and the end of the file are kept as well.
 *
 * The source is the Markdown the editor was created with, or the Markdown
 * last passed to `setContent` or `updateContent` (with `contentType: "markdown"`).
 */
export const MarkdownSource = Extension.create<MarkdownSourceOptions>({
  name: "notraMarkdownSource",

  // After the Markdown extension: wraps its `getMarkdown()` and its `setContent` command.
  priority: 90,

  addOptions() {
    return { context: null }
  },

  onBeforeCreate() {
    const { editor } = this
    const getMarkdown = editor.getMarkdown
    editor.getMarkdown = () => {
      const snapshot = sourceKey.getState(editor.state)
      return snapshot && editor.markdown
        ? new SourceWriter(editor.markdown, snapshot).write(editor.state.doc)
        : getMarkdown.call(editor)
    }
  },

  addCommands() {
    return {
      setContent: (content, options) => (props) => {
        const { editor, tr, dispatch } = props
        const manager = editor.markdown
        if (options?.contentType !== "markdown" || typeof content !== "string" || !manager) {
          const handled = coreCommands.setContent(content, options)(props)
          if (handled && dispatch) tr.setMeta(SOURCE_META, null)
          return handled
        }
        const handled = coreCommands.setContent(manager.parse(content), options)(props)
        if (handled && dispatch) tr.setMeta(SOURCE_META, content)
        return handled
      },
    }
  },

  addProseMirrorPlugins() {
    const { editor } = this
    const { context } = this.options
    const snapshot = (source: string | null, doc: ProseMirrorNode) =>
      source !== null && context && editor.markdown ? createSnapshot(editor.markdown, context, source, doc) : null

    return [
      new Plugin<SourceSnapshot | null>({
        key: sourceKey,
        state: {
          init: (_config, state) => {
            const source = context?.initialSource ?? null
            if (context) context.initialSource = null
            return snapshot(source, state.doc)
          },
          apply: (tr, value, _oldState, newState) => {
            const source: unknown = tr.getMeta(SOURCE_META)
            if (source !== undefined) {
              return snapshot(typeof source === "string" ? source : null, newState.doc)
            }
            const update = tr.getMeta(UPDATE_CONTENT_META) as UpdateContentMeta | undefined
            if (update) {
              const isMarkdown = update.contentType === "markdown" && typeof update.content === "string"
              return snapshot(isMarkdown ? (update.content as string) : null, newState.doc)
            }
            return value
          },
        },
      }),
    ]
  },
})

/** Returns whether the editor writes unchanged Markdown blocks back verbatim. */
export function isPreservingMarkdownSource(editor: Editor): boolean {
  return sourceKey.getState(editor.state) != null
}
