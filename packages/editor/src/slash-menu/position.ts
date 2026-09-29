import type { EditorView } from '@tiptap/pm/view'

/** A box in viewport coordinates. */
export interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

/** The distance between the trigger slash and the menu. */
const gap = 4
/** The distance that the menu keeps from the edges of the viewport when there is room. */
const margin = 8

/** Returns the box of the character that starts at `pos`, such as the trigger slash. */
export function characterBox(view: EditorView, pos: number): Box {
  const start = view.coordsAtPos(pos, 1)
  const end = view.coordsAtPos(pos + 1, -1)
  return {
    left: Math.min(start.left, end.left),
    right: Math.max(start.right, end.right),
    top: Math.min(start.top, end.top),
    bottom: Math.max(start.bottom, end.bottom),
  }
}

/**
 * Positions `menu`, whose `position` is `fixed` or `absolute`, next to `anchor` within the
 * viewport. The menu goes below the anchor, unless the room below is smaller than the menu's
 * natural height and the room above is larger than the room below; then it goes above. When the
 * room on the chosen side is smaller than the natural height, the menu's height is limited to
 * that room and its content scrolls. Horizontally the menu starts at the anchor's left edge,
 * moved left as far as needed to stay within the viewport while still overlapping the anchor.
 */
export function placeMenu(menu: HTMLElement, anchor: Box): void {
  const root = menu.ownerDocument.documentElement
  const viewportWidth = root.clientWidth
  const viewportHeight = root.clientHeight
  const { scrollTop } = menu

  // At left 0 and top 0 the menu shows where its containing block starts, and without an inline
  // maximum height it has its natural height.
  menu.style.maxHeight = ''
  menu.style.left = '0px'
  menu.style.top = '0px'
  const origin = menu.getBoundingClientRect()
  const naturalHeight = origin.height
  const width = origin.width

  const roomBelow = viewportHeight - anchor.bottom
  const roomAbove = anchor.top
  const below = !(roomBelow < naturalHeight && roomAbove > roomBelow)
  const room = Math.max(0, below ? roomBelow : roomAbove)

  let height = naturalHeight
  let offset = gap
  if (naturalHeight + gap > room) {
    if (naturalHeight <= room) {
      offset = room - naturalHeight
    } else {
      offset = Math.min(gap, room)
      height = Math.max(0, room - offset - Math.min(margin, Math.max(0, room - offset) / 2))
    }
  }
  const top = below ? anchor.bottom + offset : anchor.top - offset - height

  const maxLeft = Math.max(margin, viewportWidth - margin - width)
  let left = Math.min(Math.max(anchor.left, margin), maxLeft)
  if (left >= anchor.right || left + width <= anchor.left) {
    left = Math.max(0, Math.min(anchor.left, viewportWidth - width))
  }

  if (height < naturalHeight) menu.style.maxHeight = `${height}px`
  menu.style.left = `${left - origin.left}px`
  menu.style.top = `${top - origin.top}px`
  menu.scrollTop = scrollTop
}

/**
 * Raises `menu` above the elements that contain `element`, such as the editable surface, when
 * one of them has a z-index at least as high as the menu's own, so that none of them covers it.
 */
export function stackAbove(menu: HTMLElement, element: Element): void {
  const own = Number.parseInt(getComputedStyle(menu).zIndex, 10)
  let highest = Number.NEGATIVE_INFINITY
  const { body } = element.ownerDocument
  for (let node = element.parentElement; node && node !== body; node = node.parentElement) {
    const zIndex = Number.parseInt(getComputedStyle(node).zIndex, 10)
    if (!Number.isNaN(zIndex)) highest = Math.max(highest, zIndex)
  }
  if (Number.isFinite(highest) && !(own > highest)) menu.style.zIndex = String(highest + 1)
}

function scrolls(element: HTMLElement): boolean {
  if (element.scrollHeight <= element.clientHeight) return false
  const { overflowY } = getComputedStyle(element)
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden'
}

/**
 * Scrolls the elements between `element` and `container`, including `container`, just enough
 * for `element` to lie entirely within their visible parts.
 */
export function revealWithin(container: HTMLElement, element: HTMLElement): void {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (scrolls(node)) {
      const box = node.getBoundingClientRect()
      const visibleTop = box.top + node.clientTop
      const visibleBottom = visibleTop + node.clientHeight
      const rect = element.getBoundingClientRect()
      if (rect.top < visibleTop) node.scrollTop -= visibleTop - rect.top
      else if (rect.bottom > visibleBottom) node.scrollTop += rect.bottom - visibleBottom
    }
    if (node === container) break
  }
}
