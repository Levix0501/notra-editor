/**
 * Scrolls `container` the least amount needed to show everything from the top
 * of `start` to the bottom of `end`, honoring the container's `scroll-padding`.
 *
 * Unlike `Element.scrollIntoView()`, it never scrolls the ancestors of the
 * container, such as the page.
 */
export function scrollIntoViewWithin(container: HTMLElement, start: Element, end: Element = start): void {
  const style = getComputedStyle(container)
  const bounds = container.getBoundingClientRect()
  const viewTop = bounds.top + container.clientTop + (Number.parseFloat(style.scrollPaddingTop) || 0)
  const viewBottom =
    bounds.top + container.clientTop + container.clientHeight - (Number.parseFloat(style.scrollPaddingBottom) || 0)
  const top = start.getBoundingClientRect().top
  const bottom = end.getBoundingClientRect().bottom

  if (top < viewTop) {
    container.scrollTop -= viewTop - top
  } else if (bottom > viewBottom) {
    // When the range is taller than the container, its top stays visible.
    container.scrollTop += Math.min(bottom - viewBottom, top - viewTop)
  }
}
