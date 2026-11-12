import type { Editor } from "@tiptap/core"
import { renderTableToMarkdown, Table, TableCell, TableHeader } from "@tiptap/extension-table"
import { isHistoryTransaction } from "@tiptap/pm/history"
import { Fragment, type Node as ProseMirrorNode, type ResolvedPos, type Schema, Slice } from "@tiptap/pm/model"
import { Plugin, PluginKey, type Selection, type Transaction } from "@tiptap/pm/state"
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform"

/** Content of cells that only hold text, like the cells of Markdown tables. */
const TEXT_CELL_CONTENT = "paragraph"

/** The depth of the cell that only holds text around a position, or -1. */
function getTextCellDepth($pos: ResolvedPos): number {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const { spec } = $pos.node(depth).type
    if (spec.tableRole === "cell" || spec.tableRole === "header_cell") {
      return spec.content === TEXT_CELL_CONTENT ? depth : -1
    }
  }
  return -1
}

/** Whether the selection is inside of a table cell that only holds text (see {@link TextTableCell}). */
export function isInTextCell(selection: Selection): boolean {
  return getTextCellDepth(selection.$from) !== -1
}

/**
 * Where a block goes that is inserted at `pos`: after the table when `pos`
 * is inside of a cell that only holds text.
 */
export function getBlockInsertPosition(doc: ProseMirrorNode, pos: number): number {
  const $pos = doc.resolve(pos)
  const depth = getTextCellDepth($pos)
  // Cells are inside of rows, which are inside of the table.
  return depth === -1 ? pos : $pos.after(depth - 2)
}

/**
 * Whether a step of the transaction inserts blocks into a cell that only
 * holds text, which splits its table: content that does not fit into a cell
 * is placed by closing the cell, its row and its table, and opening them
 * again after it. Content that only closes the cell or the row stays in the
 * table, such as the rows that undoing a deletion across cells puts back.
 */
function splitsTable(tr: Transaction): boolean {
  return tr.steps.some((step, index) => {
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
      return false
    }
    const doc = tr.docs[index] as ProseMirrorNode
    const $from = doc.resolve(step.from)
    const depth = getTextCellDepth($from)
    if (depth === -1 || step.to > $from.end(depth)) {
      return false
    }
    // Cells are inside of rows, which are inside of the table.
    const table = depth - 2
    const $to = doc.resolve(step.to)
    return step.slice.openStart > $from.depth - table || step.slice.openEnd > $to.depth - table
  })
}

/** Pasted content for a cell that only holds text: its text blocks, separated by line breaks. */
export function toCellContent(slice: Slice, schema: Schema): Slice {
  let isInline = true
  slice.content.forEach((node) => {
    isInline &&= node.isInline
  })
  if (isInline) {
    return slice
  }
  const blocks: ProseMirrorNode[] = []
  slice.content.descendants((node) => {
    if (node.isTextblock) blocks.push(node)
    return !node.isTextblock
  })
  const lineBreak = schema.nodes.hardBreak
  const inline: ProseMirrorNode[] = []
  const addLineBreak = () => {
    if (lineBreak && inline.length > 0) inline.push(lineBreak.create())
  }
  for (const block of blocks) {
    addLineBreak()
    block.content.forEach((child) => {
      if (!block.type.spec.code || !child.text) {
        inline.push(child)
        return
      }
      // Lines of code become lines of the cell.
      child.text.split("\n").forEach((line, lineIndex) => {
        if (lineIndex > 0) addLineBreak()
        if (line) inline.push(schema.text(line, child.marks))
      })
    })
  }
  return new Slice(Fragment.from(inline), 0, 0)
}

/** Enter adds a line break in cells that only hold text. */
function addLineBreak(editor: Editor): boolean {
  return isInTextCell(editor.state.selection) && editor.commands.setHardBreak()
}

/**
 * A table cell that only holds text (with line breaks), like the cells of
 * Markdown tables: lists, quotes or code in a cell would be written to
 * Markdown as text. Enter adds a line break, which Markdown keeps as `<br>`,
 * pasted blocks become lines of the cell, and blocks inserted into a cell do
 * not split its table.
 */
export const TextTableCell = TableCell.extend({
  content: TEXT_CELL_CONTENT,

  addKeyboardShortcuts() {
    return { Enter: () => addLineBreak(this.editor) }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("notraTextCells"),
        // Undo and redo go back to documents that were accepted: dropping them would keep them from going further back.
        filterTransaction: (tr) => !tr.docChanged || isHistoryTransaction(tr) || !splitsTable(tr),
        props: {
          transformPasted: (slice, view) =>
            isInTextCell(view.state.selection) ? toCellContent(slice, view.state.schema) : slice,
        },
      }),
    ]
  },
})

/** A header cell that only holds text, see {@link TextTableCell}. */
export const TextTableHeader = TableHeader.extend({
  content: TEXT_CELL_CONTENT,
})

/**
 * Tables, written to Markdown without the line breaks that Tiptap writes
 * before and after them: the block that holds a table already separates it
 * from the blocks around it, so that they became extra blank lines, which
 * block quotes and callouts write as lines with only `>`.
 */
export const NotraTable = Table.extend({
  renderMarkdown(node, helpers) {
    return renderTableToMarkdown(node, helpers).replace(/^\n+|\n+$/g, "")
  },
})
