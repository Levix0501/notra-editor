import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom does not implement layout. ProseMirror and Floating UI only need
// these APIs to exist; their return values do not matter in unit tests.
if (typeof window !== "undefined") {
  const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList

  Range.prototype.getClientRects = emptyRects
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  Element.prototype.getClientRects = emptyRects
  Element.prototype.scrollIntoView = () => {}
  document.elementFromPoint = () => null

  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList

  // ProseMirror creates paste events for `view.pasteHTML()` and `view.pasteText()`.
  globalThis.ClipboardEvent ??= class extends Event {
    readonly clipboardData = null
  } as unknown as typeof ClipboardEvent

  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  afterEach(() => {
    cleanup()
  })
}
