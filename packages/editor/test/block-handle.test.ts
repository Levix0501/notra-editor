import { afterEach, describe, expect, it } from "vitest"

import { getHandlePosition } from "../src/components/block-handle/find-block"

/** Fakes the position of an element in the viewport. */
function place<T extends HTMLElement>(element: T, left: number, top: number): T {
  element.getBoundingClientRect = () => new DOMRect(left, top, 600, 28)
  return element
}

function paragraph(left: number, top: number): HTMLElement {
  const element = place(document.createElement("p"), left, top)
  element.style.lineHeight = "28px"
  return element
}

/** An editor root at (40, 100) with a content area that starts 56px further right. */
function setup() {
  const root = place(document.createElement("div"), 40, 100)
  const content = place(document.createElement("div"), 40, 100)
  content.style.paddingLeft = "56px"
  root.append(content)
  document.body.append(root)
  return { root, content }
}

describe("getHandlePosition", () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it("puts the handles of all blocks in the same column", () => {
    const { root, content } = setup()
    const topLevel = paragraph(96, 300)
    // List items are indented by their lists.
    const nested = place(document.createElement("li"), 144, 400)
    nested.append(paragraph(168, 400))
    content.append(topLevel, nested)

    expect(getHandlePosition(topLevel, content, root).left).toBe(52)
    expect(getHandlePosition(nested, content, root).left).toBe(52)
  })

  it("centers the handle on the first line of the block", () => {
    const { root, content } = setup()
    const item = place(document.createElement("li"), 144, 400)
    item.append(paragraph(168, 400), paragraph(168, 428))
    content.append(item)

    expect(getHandlePosition(item, content, root).top).toBe(302)
    root.scrollTop = 50
    expect(getHandlePosition(item, content, root).top).toBe(352)
  })
})
