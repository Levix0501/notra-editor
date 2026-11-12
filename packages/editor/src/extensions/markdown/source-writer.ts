import type { JSONContent, MarkdownToken } from "@tiptap/core"
import type { MarkdownManager } from "@tiptap/markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

import type { NotraMarkdownContext } from "./context"
import {
  EMPTY_ITEM_TEXT,
  getListKind,
  getOtherMarker,
  interruptsParagraph,
  LIST_MARKER,
  separateLists,
} from "./list-markers"
import { splitDetails } from "./marked"
import {
  createSnapshot,
  getChildren,
  getListMarkers,
  type ItemBlock,
  type ItemSource,
  isEmptyParagraph,
  type LinkDefinition,
  parseBlock,
  type SourceBlock,
  type SourceChild,
  type SourcePart,
  type SourceRange,
  type SourceSnapshot,
  trimLineBreaks,
} from "./source-snapshot"

const LISTS = new Set(["bulletList", "orderedList", "taskList"])

/** Writes nodes to Markdown on their own, without surrounding blank lines. */
function serialize(manager: MarkdownManager, content: JSONContent[]): string {
  return manager.serialize({ type: "doc", content }).replace(/^\n+|\n+$/g, "")
}

const BLANK_LINE = /\n[ \t]*\n/

/** The bullet or delimiter of the first item of a list written as `text`. */
function getFirstMarker(text: string): string | null {
  const match = /^[ \t]*(?:([-*+])|\d{1,9}([.)]))(?=[ \t\r\n]|$)/.exec(text)
  return match?.[1] ?? match?.[2] ?? null
}

/** Gives the item written as `text` another bullet or delimiter. */
function setItemMarker(text: string, marker: string): string {
  return marker === "." || marker === ")"
    ? text.replace(/^( *\d{1,9})[.)]/, `$1${marker}`)
    : text.replace(/^( *)[-*+](?=[ \t\r\n]|$)/, `$1${marker}`)
}

/**
 * Gives each list that follows a list of its kind with the same marker
 * another marker, see `separateLists`: lists that became neighbors (the
 * block between them was deleted) or new lists after a list. `texts` are the
 * written blocks, `rewrite` writes the list at an index with a marker.
 */
function separateWrittenLists(
  nodes: ProseMirrorNode[],
  texts: string[],
  rewrite: (index: number, marker: string) => string,
): void {
  let previous: { kind: string; marker: string } | null = null
  nodes.forEach((node, index) => {
    const kind = getListKind(node.type.name)
    if (!kind) {
      if (!isEmptyParagraph(node)) previous = null
      return
    }
    let marker = getFirstMarker(texts[index] ?? "")
    if (previous?.kind === kind && marker !== null && marker === previous.marker) {
      marker = getOtherMarker(marker)
      texts[index] = rewrite(index, marker)
    }
    previous = marker === null ? null : { kind, marker }
  })
}

const INDENTED_CODE = /^(?: {4}|\t)/

/**
 * Indented code that follows a list or other indented code (with only
 * blank lines between them) would continue the last item of the list or the
 * code: `rewrite` writes it with a fence instead.
 */
function separateIndentedCode(nodes: ProseMirrorNode[], texts: string[], rewrite: (index: number) => string): void {
  let absorbs = false
  nodes.forEach((node, index) => {
    if (isEmptyParagraph(node)) return
    const isCode = node.type.name === "codeBlock"
    if (isCode && absorbs && INDENTED_CODE.test(texts[index] ?? "")) {
      texts[index] = rewrite(index)
    }
    absorbs = getListKind(node.type.name) !== null || (isCode && INDENTED_CODE.test(texts[index] ?? ""))
  })
}

/** The normalized labels of link reference definitions. */
function getLabels(definitions: string): Set<string> {
  return new Set(
    Array.from(definitions.matchAll(/^ {0,3}\[((?:\\.|[^\\[\]])+)\]:/gm), (match) =>
      (match[1] as string).trim().replace(/\s+/g, " ").toLowerCase(),
    ),
  )
}

/**
 * Gives a list item the number `number`, in its source: the number of an
 * item depends on the items before it and on the start of the list, which
 * edits change. When the number gets longer or shorter, the lines of the item
 * move with its text, so that its blocks stay inside of the item.
 */
function renumberItem(text: string, number: number): string {
  const match = /^( *)(\d{1,9})(?=[.)])/.exec(text)
  if (!match || Number(match[2]) === number) {
    return text
  }
  const digits = String(number)
  const shift = digits.length - (match[2] as string).length
  const [first = "", ...rest] = text.split("\n")
  const lines = rest.map((line) => {
    if (shift === 0 || !line.trim()) return line
    if (shift > 0) return " ".repeat(shift) + line
    // Lines indented less than the text are lazy continuation lines.
    return line.slice(Math.min(/^ */.exec(line)?.[0].length ?? 0, -shift))
  })
  return [`${match[1]}${digits}${first.slice(match[0].length)}`, ...lines].join("\n")
}

/** Indents the lines of `text` from line `from` on; blank lines stay empty. */
function indentLines(text: string, indent: string, from: number): string {
  if (!indent) {
    return text
  }
  return text
    .split("\n")
    .map((line, index) => (index < from || !line ? line : indent + line))
    .join("\n")
}

/**
 * Finds the original that changed nodes replace: a run of changed nodes
 * between two matched ones (or the edges) takes the place of the originals
 * between them, when there are as many and `canReplace` accepts them.
 */
function findReplaced(
  matches: (number | null)[],
  originals: number,
  canReplace: (index: number, original: number) => boolean,
): (number | null)[] {
  const used = new Set(matches.filter((match) => match !== null))
  const replaced: (number | null)[] = matches.map(() => null)
  let start = 0
  while (start < matches.length) {
    if (matches[start] !== null) {
      start++
      continue
    }
    let end = start
    while (end < matches.length && matches[end] === null) end++
    const before = start === 0 ? -1 : (matches[start - 1] as number)
    const after = end === matches.length ? originals : (matches[end] as number)
    if (after - before - 1 === end - start) {
      for (let index = start; index < end; index++) {
        const original = before + 1 + index - start
        if (!used.has(original) && canReplace(index, original)) replaced[index] = original
      }
    }
    start = end
  }
  return replaced
}

/** The blocks, list items and table rows of a source by their text (computed when first needed). */
function getParts(snapshot: SourceSnapshot): Map<string, SourcePart[]> {
  if (!snapshot.byText) {
    const byText = new Map<string, SourcePart[]>()
    const add = (part: SourcePart) => {
      const text = part.node.textContent
      const parts = byText.get(text)
      if (parts) parts.push(part)
      else byText.set(text, [part])
    }
    snapshot.blocks.forEach((block, index) => {
      add({ node: block.node, start: block.start, end: block.end, block: index, child: null })
      block.children?.forEach((child, childIndex) => {
        add({ node: child.node, start: child.start, end: child.end, block: index, child: childIndex })
      })
    })
    snapshot.byText = byText
  }
  return snapshot.byText
}

export interface SourceWriterOptions {
  /** Shared by writers that compare the same document with several sources. */
  keys?: WeakMap<ProseMirrorNode, string>
  /** Other sources of the document, the latest first, see `SourceWriter.writeElsewhere`. */
  others?: readonly SourceSnapshot[]
}

/** Writes a document to Markdown, reusing the source of unchanged blocks. */
export class SourceWriter {
  private readonly keys: WeakMap<ProseMirrorNode, string>
  private readonly markdown = new WeakMap<ProseMirrorNode, string>()
  private readonly manager: MarkdownManager
  private readonly context: NotraMarkdownContext
  private readonly snapshot: SourceSnapshot
  private readonly others: readonly SourceSnapshot[]
  /** The link definitions of the document, read when first needed. */
  private links: Record<string, LinkDefinition> | null = null
  private readonly changedLabels = new Map<SourceSnapshot, string[]>()

  constructor(
    manager: MarkdownManager,
    context: NotraMarkdownContext,
    snapshot: SourceSnapshot,
    { keys = new WeakMap(), others = [] }: SourceWriterOptions = {},
  ) {
    this.manager = manager
    this.context = context
    this.snapshot = snapshot
    this.keys = keys
    this.others = others.filter((other) => other !== snapshot)
  }

  /** Converts an offset in the normalized source to an offset in the source as it was read. */
  private toRaw(offset: number): number {
    const { crlf } = this.snapshot
    let low = 0
    let high = crlf.length
    while (low < high) {
      const middle = (low + high) >> 1
      if ((crlf[middle] as number) < offset) low = middle + 1
      else high = middle
    }
    return offset + low
  }

  /** The source between two offsets, with its original line endings. */
  private text(start: number, end: number): string {
    return this.snapshot.raw.slice(this.toRaw(start), this.toRaw(end))
  }

  private slice(range: SourceRange): string {
    return this.text(range.start, range.end)
  }

  /** Written Markdown, with the line endings of the source. */
  private lines(markdown: string): string {
    return this.snapshot.lineEnding === "\r\n" ? markdown.replace(/\n/g, "\r\n") : markdown
  }

  /** Markdown that only identifies content: compared, never written. */
  private key(content: JSONContent[], node?: ProseMirrorNode): string {
    let key = node ? this.keys.get(node) : undefined
    if (key === undefined) {
      const { context } = this
      const escaping = context.escaping
      // Escaping like Tiptap is enough to compare, and faster.
      context.escaping = "full"
      try {
        key = serialize(this.manager, content)
      } finally {
        context.escaping = escaping
      }
      if (node) this.keys.set(node, key)
    }
    return key
  }

  private nodeKey(node: ProseMirrorNode): string {
    return this.key([node.toJSON()], node)
  }

  /** The Markdown the editor writes for a block (cached per node). */
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
        const key = this.nodeKey(block.node)
        byMarkdown.set(key, [...(byMarkdown.get(key) ?? []), blockIndex])
      }
      this.snapshot.byMarkdown = byMarkdown
    }
    const candidates = byMarkdown.get(this.nodeKey(node))
    if (!candidates?.length) {
      return null
    }
    return candidates.reduce((best, candidate) =>
      Math.abs(candidate - hint) < Math.abs(best - hint) ? candidate : best,
    )
  }

  /**
   * The blocks of a document, without the empty paragraphs at its end that
   * the trailing node extension adds. Those that the source has at its end
   * (blank lines) stay, also as new nodes: undo brings them back so.
   */
  private getBlocks(doc: ProseMirrorNode): ProseMirrorNode[] {
    const nodes = getChildren(doc)
    const { blocks, byNode } = this.snapshot
    let inSource = 0
    while (isEmptyParagraph(blocks[blocks.length - 1 - inSource]?.node)) inSource++
    let atEnd = 0
    while (isEmptyParagraph(nodes[nodes.length - 1 - atEnd])) atEnd++
    while (atEnd > inSource && !byNode.has(nodes.at(-1) as ProseMirrorNode)) {
      nodes.pop()
      atEnd--
    }
    return nodes
  }

  /**
   * How much of `doc` would be written with the source (see `write`): one for
   * every unchanged block, one for the lines before it when it follows the
   * same block as in the source (or starts the document, like in the source),
   * and one for the end of the source. With `byNode`, only the blocks that are
   * the nodes of the source are counted, which is faster.
   */
  countUnchanged(doc: ProseMirrorNode, byNode = false): number {
    let count = 0
    // The block before the current one: -1 before the first block.
    let previous: number | null = -1
    this.getBlocks(doc).forEach((node, index) => {
      const block = byNode
        ? (this.snapshot.byNode.get(node) ?? null)
        : this.findBlock(node, previous === null ? index : previous + 1)
      if (block !== null) {
        count += previous !== null && block === previous + 1 ? 2 : 1
      }
      previous = block
    })
    return previous !== null && previous === this.snapshot.blocks.length - 1 ? count + 1 : count
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
    const children = block.children ?? []
    const same = children.findIndex((original) => original.node === child)
    if (same !== -1) {
      return same
    }
    const markdown = key(child)
    const index = children.findIndex((original) => originalKey(original.node) === markdown)
    return index === -1 ? null : index
  }

  /**
   * The labels of the link definitions that another source and the document
   * define differently, or that only one of them defines: text of the source
   * that refers to them reads differently in the document.
   */
  private getChangedLabels(snapshot: SourceSnapshot): string[] {
    let labels = this.changedLabels.get(snapshot)
    if (!labels) {
      if (!this.links) {
        const lexer = new this.manager.instance.Lexer(this.manager.instance.defaults)
        this.links = (lexer.lex(this.context.definitions) as { links?: Record<string, LinkDefinition> }).links ?? {}
      }
      const current = this.links
      const before = snapshot.links
      labels = [...new Set([...Object.keys(before), ...Object.keys(current)])].filter((label) => {
        const was = before[label]
        const is = current[label]
        return !was || !is || was.href !== is.href || (was.title ?? "") !== (is.title ?? "")
      })
      this.changedLabels.set(snapshot, labels)
    }
    return labels
  }

  /**
   * Writes a node that the source does not have with another of the sources
   * that has it, the latest first: undo brings back blocks, list items and
   * table rows of before, which the source of a later change from outside
   * does not have (when the change is not part of the history, for example).
   * The node of the other source is the same or has the same content.
   * `accept` picks the parts that can take the place of the node, `adapt`
   * fits their source into the document or rejects it. Text that refers to
   * a link definition that the document defines differently is not used.
   */
  private writeElsewhere(
    node: ProseMirrorNode,
    accept: (part: SourcePart, snapshot: SourceSnapshot) => boolean,
    adapt: (markdown: string) => string | null = (markdown) => markdown,
  ): string | null {
    if (this.others.length === 0 || isEmptyParagraph(node)) {
      return null
    }
    const text = node.textContent
    for (const snapshot of this.others) {
      for (const part of getParts(snapshot).get(text) ?? []) {
        if (!accept(part, snapshot) || !part.node.eq(node)) continue
        const source = snapshot.source.slice(part.start, part.end)
        const lower = source.toLowerCase().replace(/\s+/g, " ")
        if (this.getChangedLabels(snapshot).some((label) => lower.includes(`[${label}]`))) continue
        const markdown = adapt(source)
        if (markdown !== null) return this.lines(markdown)
      }
    }
    return null
  }

  /** Writes a block with another source, see `writeElsewhere`: one that reads as the block on its own. */
  private writeBlockElsewhere(node: ProseMirrorNode, index: number): string | null {
    // Front matter is only valid at the start of the document.
    if (index > 0 && node.type.name === "rawBlock" && node.attrs.kind === "frontmatter") {
      return null
    }
    return this.writeElsewhere(node, (part, snapshot) => {
      const block = snapshot.blocks[part.block]
      return part.child === null && Boolean(block?.verified) && !block?.group
    })
  }

  /**
   * Writes a list item with another source, see `writeElsewhere`: with the
   * `marker` of the list it is in (an item with another bullet would start
   * another list) and the indentation of the list.
   */
  private writeItemElsewhere(
    item: ProseMirrorNode,
    list: ProseMirrorNode,
    marker: string | undefined,
    indent: string,
  ): string | null {
    if (!marker) {
      return null
    }
    return this.writeElsewhere(
      item,
      (part, snapshot) => part.child !== null && snapshot.blocks[part.block]?.node.type === list.type,
      (markdown) => {
        const lines = markdown.split("\n")
        const base = /^ */.exec(lines[0] ?? "")?.[0] ?? ""
        const unindented = lines.map((line) => (line.startsWith(base) ? line.slice(base.length) : line)).join("\n")
        const text = indentLines(setItemMarker(unindented, marker), indent, 0)
        return this.readsBackAsItem(text, item) ? text : null
      },
    )
  }

  /**
   * The blocks of a list item and where they are in the source. The item is
   * read again as a list of its own: the lines of its text, from which marked
   * reads the blocks, are the lines of its source without the indentation.
   * Returns `null` when the blocks do not match the item.
   */
  private readItem(item: SourceChild): ItemSource | null {
    const { source, definitions } = this.snapshot
    const schema = this.context.schema
    const lines = source.slice(item.start, item.end).split("\n")
    if (!schema || lines.some((line) => line.includes("\t"))) {
      return null
    }
    // Nested items are read without the indentation of their first line.
    const base = /^ */.exec(lines[0] ?? "")?.[0] ?? ""
    const lexer = new this.manager.instance.Lexer(this.manager.instance.defaults)
    const tokens = (
      lexer.lex(
        lines.map((line) => (line.startsWith(base) ? line.slice(base.length) : line)).join("\n"),
      ) as MarkdownToken[]
    ).filter((token) => token.type !== "space")
    const [list] = tokens
    const token = list?.type === "list" && tokens.length === 1 && list.items?.length === 1 ? list.items[0] : undefined
    const text = String(token?.text ?? "")
    const textLines = text.split("\n")
    if (
      !token ||
      !textLines[0] ||
      textLines.length > lines.length ||
      textLines.some((line, index) => !(lines[index] ?? "").endsWith(line))
    ) {
      return null
    }

    const lineStarts: number[] = []
    const textStarts: number[] = []
    let sourceOffset = item.start
    let textOffset = 0
    for (const [index, line] of lines.entries()) {
      lineStarts.push(sourceOffset)
      textStarts.push(textOffset)
      sourceOffset += line.length + 1
      textOffset += (textLines[index]?.length ?? 0) + 1
    }
    const lineOf = (offset: number) => {
      let line = 0
      while (line + 1 < textLines.length && (textStarts[line + 1] as number) <= offset) line++
      return line
    }
    const toSource = (offset: number) => {
      const line = lineOf(offset)
      const indent = (lines[line]?.length ?? 0) - (textLines[line]?.length ?? 0)
      return (lineStarts[line] as number) + indent + offset - (textStarts[line] as number)
    }

    const children: ItemBlock[] = []
    const nodes = getChildren(item.node)
    let cursor = 0
    for (const child of (token.tokens ?? []) as MarkdownToken[]) {
      // The checkbox of a task is part of the marker of the item.
      if (child.type === "checkbox") {
        continue
      }
      const raw = String(child.raw ?? "")
      const start = text.indexOf(raw, cursor)
      if (start === -1) {
        return null
      }
      cursor = start + raw.length
      if (child.type === "space") {
        continue
      }
      const node = nodes[children.length]
      const firstIsParagraph = children.length > 0 || child.type === "paragraph" || child.type === "text"
      if (!node || !firstIsParagraph) {
        return null
      }
      const end = start + trimLineBreaks(raw).length
      let verified = false
      try {
        const parsed = parseBlock(this.manager, this.context, text.slice(start, end), definitions)
        verified = parsed.length === 1 && schema.nodeFromJSON(parsed[0]).eq(node)
      } catch {
        verified = false
      }
      const block: ItemBlock = {
        node,
        start: toSource(start),
        end: toSource(end),
        line: lineStarts[lineOf(start)] as number,
        verified,
      }
      if (verified && child.type === "list" && Array.isArray(child.items) && child.items.length === node.childCount) {
        const items: SourceChild[] = []
        let itemCursor = start
        for (const [index, nested] of child.items.entries()) {
          const nestedRaw = String(nested.raw ?? "")
          const nestedStart = text.indexOf(nestedRaw, itemCursor)
          if (nestedStart === -1) break
          itemCursor = nestedStart + nestedRaw.length
          items.push({
            node: node.child(index),
            start: lineStarts[lineOf(nestedStart)] as number,
            end: toSource(nestedStart + trimLineBreaks(nestedRaw).length),
          })
        }
        if (items.length === node.childCount) {
          block.list = {
            node,
            start: block.line,
            end: block.end,
            children: items,
            list: getListMarkers(source, items, Boolean(child.loose)),
          }
        }
      }
      children.push(block)
    }
    // Blank lines that became empty paragraphs, for example, leave nodes without source.
    if (children.length !== nodes.length) {
      return null
    }

    // The blocks of an item are indented to its content: after the marker and
    // one to four spaces, or one space if more follow or the line ends there.
    // The checkbox of a task is part of the content.
    const marker = /^( *(?:[-+*]|\d{1,9}[.)]))( *)(\S?)/.exec(lines[0] ?? "")
    const spaces = marker?.[3] ? (marker[2]?.length ?? 1) : 1
    const contentStart = toSource(0)
    return {
      prefix: { start: item.start, end: contentStart },
      indent: " ".repeat((marker?.[1]?.length ?? 0) + (spaces >= 1 && spaces <= 4 ? spaces : 1)),
      loose: Boolean(list?.loose),
      children,
    }
  }

  private describeItem(item: SourceChild): ItemSource | null {
    const { items } = this.snapshot
    if (!items.has(item)) {
      let described: ItemSource | null = null
      try {
        described = this.readItem(item)
      } catch {
        described = null
      }
      items.set(item, described)
    }
    return items.get(item) ?? null
  }

  /** Whether `markdown` reads back as `nodes`, with the link definitions of the document. */
  private readsBack(nodes: ProseMirrorNode[], markdown: string): boolean {
    const schema = this.context.schema
    if (!schema) {
      return false
    }
    try {
      const parsed = parseBlock(this.manager, this.context, markdown.replace(/\r\n/g, "\n"), this.snapshot.definitions)
      return (
        parsed.length === nodes.length &&
        parsed.every((json, index) => schema.nodeFromJSON(json).eq(nodes[index] as ProseMirrorNode))
      )
    } catch {
      return false
    }
  }

  /** Whether the list item written as `text` (indented or not) reads back as `node`. */
  private readsBackAsItem(text: string, node: ProseMirrorNode): boolean {
    const lines = text.replace(/\r\n/g, "\n").split("\n")
    const base = /^ */.exec(lines[0] ?? "")?.[0] ?? ""
    const unindented = lines.map((line) => (line.startsWith(base) ? line.slice(base.length) : line)).join("\n")
    const schema = this.context.schema
    if (!schema) {
      return false
    }
    try {
      const [list, ...rest] = parseBlock(this.manager, this.context, unindented, this.snapshot.definitions)
      const parsed = list && rest.length === 0 ? schema.nodeFromJSON(list) : null
      return parsed?.childCount === 1 && Boolean(parsed.firstChild?.eq(node))
    } catch {
      return false
    }
  }

  /** Writes a list without source with a bullet or delimiter (`*`, `)`). */
  private writeListWith(node: ProseMirrorNode, marker: string): string {
    const json = node.toJSON() as JSONContent
    return serialize(this.manager, [{ ...json, attrs: { ...json.attrs, [LIST_MARKER]: marker } }])
  }

  /**
   * Writes a changed list item in the place of `item`: with the marker of
   * `item` and the source of the blocks that did not change, so that editing
   * the text of an item keeps its code blocks and nested lists, and editing a
   * nested item only rewrites that item. The line breaks between the blocks
   * of the source are kept where the item reads back the same with them.
   * Returns `null` when the item cannot be matched with its source.
   */
  private writeItem(item: SourceChild, node: ProseMirrorNode, nested: boolean): string | null {
    const described = this.describeItem(item)
    if (!described || item.node.type !== node.type) {
      return null
    }
    const { prefix, indent, loose, children: originals } = described
    // The start of the first line: the marker of the source, and the checkbox of a task as it is now.
    let head = this.slice(prefix)
    if (node.type.name === "taskItem") {
      const checked = Boolean(node.attrs.checked)
      const checkbox = /\[([ xX])\]/
      // The checkbox of a task without text is its text in the source (see `ListSyntax`).
      head = checkbox.test(head)
        ? head.replace(checkbox, (source, mark: string) =>
            (mark !== " ") === checked ? source : checked ? "[x]" : "[ ]",
          )
        : `${head}${checked ? "[x]" : "[ ]"} `
    }
    const nodes = getChildren(node)
    const matches = nodes.map((child) => {
      const index = originals.findIndex((original) => original.node === child)
      return index !== -1 && originals[index]?.verified ? index : null
    })
    // Blocks recreated without changes (undo) are found by their Markdown.
    nodes.forEach((child, index) => {
      if (matches[index] !== null) return
      const key = this.nodeKey(child)
      const found = originals.findIndex(
        (original, originalIndex) =>
          original.verified && !matches.includes(originalIndex) && this.nodeKey(original.node) === key,
      )
      if (found !== -1) matches[index] = found
    })
    const replaced = findReplaced(
      matches,
      originals.length,
      (index, original) => originals[original]?.node.type === nodes[index]?.type,
    )
    const positions = nodes.map((_, index) => matches[index] ?? replaced[index] ?? null)
    const originalOf = (index: number) => {
      const position = positions[index]
      return position === null || position === undefined ? undefined : originals[position]
    }

    // Blocks are written as children of the item: its first paragraph cannot start like a task, for example.
    const itemJSON = separateLists(node.toJSON())
    const writeBlock = (index: number, json = itemJSON.content?.[index] ?? {}) =>
      this.lines(
        indentLines(
          this.manager.renderNodeToMarkdown(json, itemJSON, index, 1).replace(/^\n+|\n+$/g, ""),
          indent,
          index === 0 ? 1 : 0,
        ),
      )
    // New items of nested lists are indented like the first item of the list.
    const listIndent = (original: ItemBlock) =>
      /^ */.exec(this.snapshot.source.slice(original.line, original.end))?.[0] ?? ""

    const verbatim = nodes.map((_, index) => matches[index] !== null && originalOf(index) !== undefined)
    // Text of the source whose lines after the first are indented less than the
    // content of the item (lazy continuation lines), all alike, is written so again.
    const first = originalOf(0)
    const lazyLines = this.snapshot.source
      .slice(first?.start ?? 0, first?.end ?? 0)
      .split("\n")
      .slice(1)
    const lazyIndent = /^ */.exec(lazyLines[0] ?? "")?.[0] ?? ""
    const lazy =
      !verbatim[0] &&
      nodes[0]?.type.name === "paragraph" &&
      lazyLines.length > 0 &&
      lazyIndent.length < indent.length &&
      lazyLines.every((line) => line.startsWith(lazyIndent) && /^\S/.test(line.slice(lazyIndent.length)))
    const writeFirst = (lazily: boolean) => {
      const text = lazily
        ? this.lines(
            indentLines(
              this.manager.renderNodeToMarkdown(itemJSON.content?.[0] ?? {}, itemJSON, 0, 1).replace(/^\n+|\n+$/g, ""),
              lazyIndent,
              1,
            ),
          )
        : writeBlock(0)
      // An empty nested item has a text, see `renderListItem`.
      return text || (nested && node.type.name !== "taskItem" ? EMPTY_ITEM_TEXT : "")
    }
    const texts = nodes.map((child, index) => {
      const original = originalOf(index)
      if (verbatim[index] && original) {
        return index === 0 ? this.slice(original) : this.text(original.line, original.end)
      }
      if (index > 0 && original?.list && LISTS.has(child.type.name)) {
        return this.writeList(original.list, child, listIndent(original))
      }
      if (index > 0 && original?.node.type === child.type) {
        // In the style of the source (code fences, setext headings), without the indentation of the item.
        const source = this.snapshot.source
          .slice(original.start, original.end)
          .split("\n")
          .map((line, lineIndex) => (lineIndex > 0 && line.startsWith(indent) ? line.slice(indent.length) : line))
          .join("\n")
        const markdown = this.writeInStyle(source, child)
        if (markdown !== null) return this.lines(indentLines(markdown, indent, 0))
      }
      return index === 0 ? writeFirst(lazy) : writeBlock(index)
    })
    // Without text, the line ends after the marker (`-`, `- [ ]`), see `renderListItem`.
    if (!texts[0]) {
      head = head.trimEnd()
    }
    separateWrittenLists(nodes, texts, (index, marker) => {
      const original = originalOf(index)
      verbatim[index] = false
      if (original?.list) {
        return this.writeList(original.list, nodes[index] as ProseMirrorNode, listIndent(original), marker)
      }
      const json = itemJSON.content?.[index] ?? {}
      return writeBlock(index, { ...json, attrs: { ...json.attrs, [LIST_MARKER]: marker } })
    })

    // Line breaks of the source between changed blocks (without a blank line) are kept when the item reads back the same.
    const assemble = (keepLineBreaks: boolean) => {
      let output = head
      let kept = false
      nodes.forEach((child, index) => {
        if (index > 0) {
          const original = originalOf(index)
          const previous = originalOf(index - 1)
          let separator: string | null = null
          if (previous && original && positions[index] === (positions[index - 1] as number) + 1) {
            const between = this.snapshot.source.slice(previous.end, original.line)
            const unchanged = verbatim[index - 1] && verbatim[index]
            if (BLANK_LINE.test(between) || unchanged || keepLineBreaks) {
              separator = this.text(previous.end, original.line)
              kept ||= !BLANK_LINE.test(between) && !unchanged
            }
          }
          const follows = !loose && child.type.name !== "paragraph" && interruptsParagraph(child.toJSON())
          output += separator ?? this.lines(follows ? "\n" : "\n\n")
        }
        output += texts[index]
      })
      return { output, kept }
    }
    const attempt = assemble(true)
    if ((!attempt.kept && !lazy) || this.readsBackAsItem(attempt.output, node)) {
      return attempt.output
    }
    if (lazy) {
      texts[0] = writeFirst(false)
    }
    return assemble(false).output
  }

  /**
   * Writes the items of a list, reusing the source of unchanged items. Items
   * start at the start of their first line; `indent` is the indentation of
   * nested lists, added to the lines of items that are written. With
   * `marker`, every item gets that bullet or delimiter.
   */
  writeList(block: SourceBlock, node: ProseMirrorNode, indent = "", marker?: string): string {
    const { children = [], list } = block
    // Only nested lists are indented: they are inside of an item.
    const nested = indent !== ""
    // Items are numbered from the start of the list, in the style of the source: `1.` for every item, or counting.
    const numbers = list?.numbers ?? []
    const repeated = numbers.length > 1 && numbers.every((number) => number === numbers[0])
    const start = Number(node.attrs.start ?? 1)
    const numberOf = (index: number) => (repeated ? start : start + index)
    const wrap = (item: ProseMirrorNode): JSONContent[] => [
      { type: node.type.name, attrs: node.attrs, content: [item.toJSON()] },
    ]
    const items = getChildren(node)
    const matches = items.map((item) => this.findChild(block, item, (child) => this.key(wrap(child))))
    const replaced = findReplaced(
      matches,
      children.length,
      (index, original) => children[original]?.node.type === items[index]?.type,
    )

    // Keep the markers of the list: `*` or `+` bullets, `1)` delimiters.
    const listMarker = list?.bullet ?? list?.delimiter
    let output = ""
    let previous: number | null = null
    items.forEach((item, index) => {
      const original = matches[index] ?? null
      const position = original ?? replaced[index] ?? null
      let text = original !== null && children[original] ? this.slice(children[original]) : null
      text ??= this.writeItemElsewhere(item, node, listMarker, indent)
      const replacedItem = position === null ? undefined : children[position]
      if (text === null && replacedItem) {
        text = this.writeItem(replacedItem, item, nested)
      }
      if (text === null) {
        // The items of nested lists are written as nested items (an empty one has a text).
        const markdown = nested
          ? this.manager.renderNodeToMarkdown(wrap(item)[0] as JSONContent, undefined, 0, 1).replace(/^\n+|\n+$/g, "")
          : serialize(this.manager, wrap(item))
        text = this.lines(indentLines(listMarker ? setItemMarker(markdown, listMarker) : markdown, indent, 0))
      }
      if (marker) {
        text = setItemMarker(text, marker)
      }
      if (node.type.name === "orderedList") {
        text = renumberItem(text, numberOf(index))
      }
      const previousChild = previous === null ? undefined : children[previous]
      const currentChild = position === null ? undefined : children[position]
      const separator =
        previous !== null && previousChild && currentChild && position === previous + 1
          ? this.text(previousChild.end, currentChild.start)
          : this.lines(list?.separator ?? "\n")
      output += index === 0 ? text : separator + text
      previous = position
    })
    return output
  }

  /**
   * Writes a table line by line, like the editor writes it: the header row
   * (an empty one when the first row is not a header row), the delimiter row
   * with the alignment of the columns, and the other rows. A line is written
   * with its source when the editor writes it the same for the original
   * table, so that a row that is no longer the header row or a changed
   * alignment is written as it is now.
   */
  private writeTable(block: SourceBlock, node: ProseMirrorNode): string | null {
    const { children = [], table } = block
    const rows = getChildren(node)
    if (!table || node.firstChild?.childCount !== table.columns) {
      return null
    }
    const written = serialize(this.manager, [node.toJSON()]).split("\n")
    // The empty header row the editor writes before a first row that is not a header row.
    const emptyHeader = written.length - rows.length - 1
    if (emptyHeader !== 0 && emptyHeader !== 1) {
      return null
    }
    // Lines are compared without the padding that aligns the columns, the delimiter row without the length of its dashes.
    const toKeys = (markdown: string) =>
      markdown.split("\n").map((line, index) => {
        const key = line
          .split("|")
          .map((cell) => cell.trim())
          .join("|")
        return index === 1 ? key.replace(/-+/g, "-") : key
      })
    const keys = toKeys(this.nodeKey(node))
    const originalKeys = toKeys(this.nodeKey(block.node))
    // The source of each line of the original table: its header row, its delimiter row and its other rows.
    const sources = [children[0], table.delimiter, ...children.slice(1)]

    const isRow = (part: SourcePart, snapshot: SourceSnapshot) =>
      part.child !== null && snapshot.blocks[part.block]?.node.type === node.type
    const lines = written.map((text, index) => {
      let source: SourceRange | undefined
      // The row of the line: none for the delimiter row and an empty header row.
      let row: ProseMirrorNode | undefined
      if (index === 0) {
        // The header row decides how many columns a table has: only the one of the source takes its place.
        source = keys[0] === originalKeys[0] ? children[0] : undefined
        row = emptyHeader ? undefined : rows[0]
      } else if (index === 1) {
        source = keys[1] === originalKeys[1] ? table.delimiter : undefined
      } else {
        row = rows[index - 1 - emptyHeader]
        source =
          children.find((child) => child.node === row) ??
          sources[originalKeys.findIndex((key, original) => original !== 1 && key === keys[index])]
      }
      if (source) {
        return { text: this.slice(source), source }
      }
      return { text: (row && this.writeElsewhere(row, isRow)) ?? text, source }
    })
    // Lines of the source keep the line break that followed them.
    const lineBreakAfter = (range: SourceRange | undefined) =>
      range && this.snapshot.source[range.end] === "\n" ? this.text(range.end, range.end + 1) : this.snapshot.lineEnding
    return lines
      .map((line, index) => (index === 0 ? "" : lineBreakAfter(lines[index - 1]?.source)) + line.text)
      .join("")
  }

  /** Writes a list or table item by item, in the place of a block of the same type. */
  private writeParts(block: SourceBlock, node: ProseMirrorNode): string | null {
    if (block.list) return this.writeList(block, node)
    if (block.table) return this.writeTable(block, node)
    return null
  }

  /**
   * Writes a changed heading in the place of a setext heading (`Title` over
   * `=====`), the Markdown `source`, in the same style, with the underline of
   * the source, when the result reads back as the heading. Its text is
   * written like a paragraph: it can have several lines.
   */
  private writeSetextHeading(source: string, node: ProseMirrorNode): string | null {
    const underline = /\n {0,3}(=+|-+)[ \t]*$/.exec(source)
    const level = underline?.[1]?.startsWith("=") ? 1 : 2
    const schema = this.context.schema
    const paragraph = schema?.nodes.paragraph
    if (!underline || !schema || !paragraph || node.type.name !== "heading" || node.attrs.level !== level) {
      return null
    }
    const text = this.toMarkdown(paragraph.create(null, node.content))
    const markdown = `${text}${underline[0]}`
    try {
      const [heading, ...rest] = parseBlock(this.manager, this.context, markdown, this.snapshot.definitions)
      if (!text.trim() || rest.length > 0 || !heading || !schema.nodeFromJSON(heading).eq(node)) {
        return null
      }
    } catch {
      return null
    }
    return markdown
  }

  /**
   * Writes changed code in the place of a code block, the Markdown `source`,
   * in the style of the source: between its fences (`~~~`, a longer fence
   * than needed, the info string) or indented, when the code allows it and
   * the result reads back as the block.
   */
  private writeCodeBlock(source: string, node: ProseMirrorNode): string | null {
    if (node.type.name !== "codeBlock") {
      return null
    }
    const code = node.textContent
    const lines = code.split("\n")
    const language = String(node.attrs.language ?? "")
    let markdown: string | null = null

    const fence = /^( {0,3})(`{3,}|~{3,})(.*)\n/.exec(source)
    if (fence) {
      const [opening = "", indent = "", marker = "", info = ""] = fence
      const character = marker[0] === "`" ? "`" : "~"
      const closing = new RegExp(`\\n( {0,3}${character}{${marker.length},}[ \\t]*)$`).exec(source)?.[1]
      const closes = new RegExp(`^ {0,3}${character}{${marker.length},}[ \\t]*$`)
      if (closing !== undefined && !lines.some((line) => closes.test(line))) {
        // The info string of the source is kept while the language is the same.
        const start = language === info.trim() ? opening.slice(0, -1) : `${indent}${marker}${language}`
        const content = lines.map((line) => (line ? indent + line : line)).join("\n")
        markdown = `${start}\n${code ? `${content}\n` : ""}${closing}`
      }
    } else if (
      !language &&
      /\S/.test(lines[0] ?? "") &&
      /\S/.test(lines.at(-1) ?? "") &&
      source.split("\n").every((line) => !line.trim() || /^(?: {4}|\t)/.test(line))
    ) {
      // Indented code: blank lines at its start and end would not be read.
      markdown = lines.map((line) => (line ? `    ${line}` : line)).join("\n")
    }
    return markdown !== null && this.readsBack([node], markdown) ? markdown : null
  }

  /**
   * Writes a changed heading or code block in the style of the Markdown
   * `source` of the block it replaces (see above), with line breaks of `\n`.
   * Blocks of list items are written so too, without their indentation.
   */
  private writeInStyle(source: string, node: ProseMirrorNode): string | null {
    return this.writeSetextHeading(source, node) ?? this.writeCodeBlock(source, node)
  }

  /**
   * Writes a changed toggle in the place of a `<details>` block: with the
   * source of its summary while the summary is unchanged (it can hold HTML
   * the editor does not keep, such as `<a id="…">`), and its content block
   * by block, like a document. The result must read back as the toggle.
   */
  private writeDetails(block: SourceBlock, node: ProseMirrorNode): string | null {
    const [summary, content] = getChildren(node)
    const [originalSummary, originalContent] = getChildren(block.node)
    const source = this.snapshot.source.slice(block.start, block.end)
    const parts = splitDetails(source)
    if (node.type.name !== "details" || !summary || !content || !originalSummary || !originalContent || !parts) {
      return null
    }
    // The blank lines around the content stay with the tags.
    const bodyText = source.slice(parts.body.start, parts.body.end)
    const bodyStart = parts.body.start + (/^(?:[ \t]*\n)*/.exec(bodyText)?.[0].length ?? 0)
    const bodyEnd = Math.max(bodyStart, parts.body.end - (/(?:\n[ \t]*)*$/.exec(bodyText)?.[0].length ?? 0))
    const at = (offset: number) => block.start + offset

    let head = this.text(block.start, at(bodyStart))
    if (!summary.eq(originalSummary)) {
      if (!parts.summary) return null
      const written = this.lines(serialize(this.manager, [summary.toJSON()]))
      head = this.text(block.start, at(parts.summary.start)) + written + this.text(at(parts.summary.end), at(bodyStart))
    }
    let body = this.text(at(bodyStart), at(bodyEnd))
    if (!content.eq(originalContent)) {
      const snapshot = createSnapshot(this.manager, this.context, body, originalContent, this.snapshot.definitions)
      if (!snapshot) return null
      body = new SourceWriter(this.manager, this.context, snapshot).write(content)
    }
    const markdown = head + body + this.text(at(bodyEnd), block.end)
    return this.readsBack([node], markdown) ? markdown : null
  }

  /** Writes a changed node in the place of a block of the same type, in the way of the block. */
  private writeReplaced(block: SourceBlock, node: ProseMirrorNode): string | null {
    const writeInStyle = () => {
      const markdown = this.writeInStyle(this.snapshot.source.slice(block.start, block.end), node)
      return markdown === null ? null : this.lines(markdown)
    }
    return this.writeParts(block, node) ?? writeInStyle() ?? this.writeDetails(block, node)
  }

  write(doc: ProseMirrorNode): string {
    const { blocks, source } = this.snapshot
    const nodes = this.getBlocks(doc)

    // Unchanged blocks, lists and tables written item by item or row by row,
    // and blocks of other sources (those are not matches: they take the
    // place of the changed blocks of this source).
    const matches: (number | null)[] = []
    const texts: (string | null)[] = []
    let previous: number | null = null
    nodes.forEach((node, index) => {
      const hint = previous === null ? index : previous + 1
      let block = this.findBlock(node, hint)
      let text: string | null = null
      if (block !== null) {
        text = this.slice(blocks[block] as SourceBlock)
      } else {
        block = this.findParent(node)
        text = block === null ? null : this.writeParts(blocks[block] as SourceBlock, node)
        if (text === null) block = null
      }
      matches.push(block)
      texts.push(text ?? this.writeBlockElsewhere(node, index))
      previous = block
    })
    // Unchanged blocks whose text refers to a definition that was added or deleted read differently: they are written again.
    const loaded = getLabels(this.snapshot.definitions)
    const current = getLabels(this.context.definitions)
    const changed = [...loaded, ...current].filter((label) => loaded.has(label) !== current.has(label))
    if (changed.length > 0) {
      texts.forEach((text, index) => {
        const lower = text?.toLowerCase().replace(/\s+/g, " ")
        if (lower && changed.some((label) => lower.includes(`[${label}]`))) texts[index] = null
      })
    }
    // Blocks read from the same source are only written back when all of them are unchanged, in order.
    for (const block of blocks) {
      if (!block.group || blocks[block.group.first] !== block) continue
      const { first, size } = block.group
      const start = matches.indexOf(first)
      const together =
        start !== -1 &&
        Array.from({ length: size }, (_, offset) => matches[start + offset] === first + offset).every(Boolean)
      if (together) continue
      matches.forEach((match, index) => {
        if (match !== null && match >= first && match < first + size) {
          matches[index] = null
          texts[index] = null
        }
      })
    }
    const replaced = findReplaced(
      matches,
      blocks.length,
      (index, block) => !blocks[block]?.group && blocks[block]?.node.type === nodes[index]?.type,
    )
    const positions = nodes.map((_, index) => matches[index] ?? replaced[index] ?? null)
    const blockOf = (index: number) => {
      const position = positions[index]
      return position === null || position === undefined ? undefined : blocks[position]
    }

    const written = nodes.map((node, index) => {
      const block = blockOf(index)
      const text = texts[index] ?? (block && matches[index] === null ? this.writeReplaced(block, node) : null)
      return text ?? this.lines(this.writeNode(node, index))
    })
    separateWrittenLists(nodes, written, (index, marker) => {
      const block = blockOf(index)
      const node = nodes[index] as ProseMirrorNode
      return block?.list ? this.writeList(block, node, "", marker) : this.lines(this.writeListWith(node, marker))
    })
    separateIndentedCode(nodes, written, (index) => this.lines(this.writeNode(nodes[index] as ProseMirrorNode, index)))
    const verbatim = written.map((text, index) => {
      const block = blockOf(index)
      return block !== undefined && text === this.slice(block)
    })

    let output = ""
    nodes.forEach((_, index) => {
      if (index === 0) {
        output += positions[0] === 0 ? this.text(0, (blocks[0] as SourceBlock).start) : ""
      } else {
        // The source between two blocks that were neighbors is kept when it has a blank line, or when the blocks read back the same with it.
        const last = positions[index - 1]
        const block = positions[index]
        let separator: string | null = null
        if (last !== null && last !== undefined && block === last + 1) {
          const start = (blocks[last] as SourceBlock).end
          const end = (blocks[block] as SourceBlock).start
          const between = this.text(start, end)
          if (
            BLANK_LINE.test(source.slice(start, end)) ||
            (verbatim[index - 1] && verbatim[index]) ||
            this.readsBack(nodes.slice(index - 1, index + 1), `${written[index - 1]}${between}${written[index]}`)
          ) {
            separator = between
          }
        }
        output += separator ?? this.lines("\n\n")
      }
      output += written[index]
    })

    const last = positions.at(-1) ?? null
    const lastBlock = blocks.at(-1)
    if (lastBlock && last === blocks.length - 1) {
      output += this.text(lastBlock.end, source.length)
    } else if (source.endsWith("\n")) {
      output += this.snapshot.lineEnding
    }
    return output
  }

  private writeNode(node: ProseMirrorNode, index: number): string {
    // Front matter is only valid at the start of the document.
    if (node.type.name === "rawBlock" && node.attrs.kind === "frontmatter" && index > 0) {
      return serialize(this.manager, [{ type: "paragraph" }, node.toJSON()])
    }
    return this.toMarkdown(node)
  }
}
