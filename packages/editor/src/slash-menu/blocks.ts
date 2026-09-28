import type { JSONContent, Range } from '@tiptap/core'
import { Fragment, type Node as ProseMirrorNode, type Schema } from '@tiptap/pm/model'
import { type EditorState, TextSelection, type Transaction } from '@tiptap/pm/state'
import { canJoin } from '@tiptap/pm/transform'

/** Where and how a block item's block is placed. */
export interface BlockPlacement {
  /**
   * Whether the new content takes the place of the block that holds the query, because that
   * block holds nothing but the query.
   */
  replace: boolean
  /** The position directly before the block that holds the query. */
  blockStart: number
  /** The position directly after the block that holds the query. */
  blockEnd: number
  /** The block, followed by an empty textblock when the block contains no textblock. */
  content: Fragment
  /** The block itself. */
  node: ProseMirrorNode
  /** The offset, within `content`, of the position where the cursor goes. */
  cursor: number
}

/**
 * Creates the node that a block item describes, filling in content that its type requires, or
 * returns `null` when the schema cannot represent it.
 */
export function createBlockNode(schema: Schema, block: JSONContent): ProseMirrorNode | null {
  try {
    const node = schema.nodeFromJSON(block)
    try {
      node.check()
      return node
    } catch {
      const filled = node.type.createAndFill(node.attrs, node.content, node.marks)
      if (!filled) return null
      filled.check()
      return filled
    }
  } catch {
    return null
  }
}

/** Returns the offset, relative to the start of `node`, of the start of its first textblock. */
function firstTextblockOffset(node: ProseMirrorNode): number | null {
  if (node.isTextblock) return 1
  let offset: number | null = null
  node.descendants((child, pos) => {
    if (offset !== null) return false
    if (child.isTextblock) {
      offset = pos + 2
      return false
    }
    return true
  })
  return offset
}

/**
 * Returns an empty textblock to put after a block without textblocks. When that block replaces
 * a paragraph, the paragraph's attributes are kept, as a Markdown shortcut typed into it would.
 */
function emptyTextblock(schema: Schema, replaced: ProseMirrorNode | null): ProseMirrorNode | null {
  if (replaced?.type.name === 'paragraph') return replaced.type.create(replaced.attrs)
  return schema.nodes.paragraph?.createAndFill() ?? null
}

/**
 * Plans how `node` is placed for the query in `range`: in place of the paragraph or heading that
 * holds the query when that block holds nothing else, and otherwise directly after it within
 * the same parent. Returns `null` when the schema does not allow the node there.
 */
export function planBlock(
  state: EditorState,
  range: Range,
  node: ProseMirrorNode,
): BlockPlacement | null {
  const $from = state.doc.resolve(range.from)
  const depth = $from.depth
  if (depth < 1) return null
  const current = $from.parent
  const parent = $from.node(depth - 1)
  const index = $from.index(depth - 1)
  const replace = range.from === $from.start() && range.to === $from.end()

  let content = Fragment.from(node)
  let cursor = firstTextblockOffset(node)
  if (cursor === null) {
    const textblock = emptyTextblock(state.schema, replace ? current : null)
    if (!textblock) return null
    content = Fragment.from([node, textblock])
    cursor = node.nodeSize + 1
  }

  const allowed = replace
    ? parent.canReplace(index, index + 1, content)
    : parent.canReplace(index + 1, index + 1, content)
  if (!allowed) return null

  return { replace, blockStart: $from.before(), blockEnd: $from.after(), content, node, cursor }
}

/**
 * Whether a list with a `start` attribute continues the numbering of the list before it, which
 * the ordered list's Markdown shortcut requires before it joins the two lists.
 */
function continuesNumbering(before: ProseMirrorNode, node: ProseMirrorNode): boolean {
  const start = node.attrs.start
  if (typeof start !== 'number') return true
  const { type, start: previousStart } = before.attrs
  const decimal = type === undefined || type === null || type === '1'
  return decimal && typeof previousStart === 'number' && before.childCount + previousStart === start
}

/**
 * Removes the query in `range` and places the block as `placement` describes, then puts the
 * cursor at the start of the first textblock of the placed content. A placed block that is not
 * a textblock is joined with a directly preceding node of the same type when the two can be
 * joined, as the Markdown shortcuts for lists and blockquotes do.
 */
export function placeBlock(tr: Transaction, placement: BlockPlacement, range: Range): Transaction {
  const { replace, blockStart, blockEnd, content, node, cursor } = placement
  if (replace) {
    tr.replaceWith(blockStart, blockEnd, content)
    tr.setSelection(TextSelection.create(tr.doc, blockStart + cursor))
    const before = tr.doc.resolve(blockStart).nodeBefore
    if (
      !node.isTextblock &&
      before?.type === node.type &&
      canJoin(tr.doc, blockStart) &&
      continuesNumbering(before, node)
    ) {
      tr.join(blockStart)
    }
  } else {
    tr.delete(range.from, range.to)
    const insertAt = tr.mapping.map(blockEnd)
    tr.insert(insertAt, content)
    tr.setSelection(TextSelection.create(tr.doc, insertAt + cursor))
  }
  return tr.scrollIntoView()
}
