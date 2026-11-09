import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorView } from "@tiptap/pm/view"

/** A block the handle can be attached to. */
export interface HandleTarget {
  /** Position directly before the block. */
  pos: number
  node: ProseMirrorNode
  dom: HTMLElement
}

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"])
const LIST_ITEM_TYPES = new Set(["listItem", "taskItem"])
const LINE_SELECTOR = "p, h1, h2, h3, h4, h5, h6, pre, summary"

export function isListItem(node: ProseMirrorNode): boolean {
  return LIST_ITEM_TYPES.has(node.type.name)
}

function getDom(view: EditorView, pos: number): HTMLElement | null {
  const dom = view.nodeDOM(pos)
  return dom instanceof HTMLElement ? dom : null
}

/** Returns the last child of `parent` whose top edge is above `y`. */
function findChildAtY(
  view: EditorView,
  parent: ProseMirrorNode,
  parentPos: number,
  y: number,
  filter: (node: ProseMirrorNode) => boolean = () => true,
): HandleTarget | null {
  let result: HandleTarget | null = null
  const contentStart = parentPos < 0 ? 0 : parentPos + 1

  parent.forEach((node, offset) => {
    if (!filter(node)) return
    const pos = contentStart + offset
    const dom = getDom(view, pos)
    if (!dom) return
    if (!result || dom.getBoundingClientRect().top <= y) {
      result = { pos, node, dom }
    }
  })

  return result
}

/** Binary search over the top-level blocks, which are laid out vertically. */
function findTopLevelBlockAtY(view: EditorView, y: number): HandleTarget | null {
  const { doc } = view.state
  const offsets: number[] = []
  doc.forEach((_node, offset) => {
    offsets.push(offset)
  })

  let low = 0
  let high = offsets.length - 1
  let index = 0

  while (low <= high) {
    const middle = (low + high) >> 1
    const offset = offsets[middle]
    const dom = offset === undefined ? null : getDom(view, offset)
    if (!dom) {
      // Unexpected DOM structure: fall back to a linear scan.
      return findChildAtY(view, doc, -1, y)
    }
    if (dom.getBoundingClientRect().top <= y) {
      index = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  const pos = offsets[index]
  const node = doc.maybeChild(index)
  const dom = pos === undefined ? null : getDom(view, pos)
  return node && dom && pos !== undefined ? { pos, node, dom } : null
}

/**
 * Finds the block at the vertical position `y` (in client coordinates).
 * Lists are descended into so that every list item gets its own handle.
 */
export function findBlockAtY(view: EditorView, y: number): HandleTarget | null {
  let target = findTopLevelBlockAtY(view, y)

  while (target && LIST_TYPES.has(target.node.type.name)) {
    const item = findChildAtY(view, target.node, target.pos, y)
    if (!item) break
    target = item

    const nestedList = findChildAtY(view, item.node, item.pos, y, (node) => LIST_TYPES.has(node.type.name))
    if (!nestedList || nestedList.dom.getBoundingClientRect().top > y) break
    target = nestedList
  }

  return target
}

/** Height of the handle buttons, in pixels. */
const HANDLE_HEIGHT = 24
/** Horizontal gap between the handle and the content, in pixels. */
const HANDLE_GAP = 4

/** Position of the handle relative to the editor root. */
export interface HandlePosition {
  top: number
  /** Position of the right edge of the handle. */
  left: number
}

/**
 * Positions the handle of `block` relative to `root`: next to the first line of
 * the block, right before the start of `content`. Every block, however indented
 * (e.g. a nested list item), gets its handle in the same column.
 */
export function getHandlePosition(block: HTMLElement, content: HTMLElement, root: HTMLElement): HandlePosition {
  const rootRect = root.getBoundingClientRect()
  const paddingLeft = Number.parseFloat(window.getComputedStyle(content).paddingLeft) || 0
  const contentLeft = content.getBoundingClientRect().left + content.clientLeft + paddingLeft
  return {
    top: getFirstLineCenter(block) - rootRect.top + root.scrollTop - HANDLE_HEIGHT / 2,
    left: contentLeft - rootRect.left + root.scrollLeft - HANDLE_GAP,
  }
}

/** Vertical center of the first line of text in a block (client coordinates). */
export function getFirstLineCenter(dom: HTMLElement): number {
  const line = dom.matches(LINE_SELECTOR) ? dom : dom.querySelector<HTMLElement>(LINE_SELECTOR)

  if (!line) {
    const rect = dom.getBoundingClientRect()
    return rect.top + Math.min(rect.height, 24) / 2
  }

  const rect = line.getBoundingClientRect()
  const style = window.getComputedStyle(line)
  const fontSize = Number.parseFloat(style.fontSize) || 16
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.5
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const borderTop = Number.parseFloat(style.borderTopWidth) || 0

  return rect.top + borderTop + paddingTop + lineHeight / 2
}
