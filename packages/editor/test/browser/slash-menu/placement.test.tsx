import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import type { SlashMenuItem } from '../../../src'
import {
  commandItem,
  expectOpen,
  highlightedOption,
  menuElement,
  placeCursor,
  renderMenu,
  type,
} from './helpers'

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

/** The box of the first `/` in `root`. */
function slashBox(root: HTMLElement): Box {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.nodeValue?.indexOf('/') ?? -1
    if (index >= 0) {
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + 1)
      const { left, right, top, bottom } = range.getBoundingClientRect()
      return { left, right, top, bottom }
    }
  }
  throw new Error('no slash')
}

function menuBox(): Box {
  const menu = menuElement()
  if (!menu) throw new Error('the menu is closed')
  const { left, right, top, bottom } = menu.getBoundingClientRect()
  return { left, right, top, bottom }
}

function viewport(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }
}

/** Whether the menu lies within the viewport and overlaps the slash horizontally. */
function withinViewportAndOverlapping(slash: Box, menu: Box): boolean {
  const { width, height } = viewport()
  return (
    menu.left >= 0 &&
    menu.top >= 0 &&
    menu.right <= width &&
    menu.bottom <= height &&
    menu.left < slash.right &&
    menu.right > slash.left
  )
}

function below(slash: Box, menu: Box): boolean {
  return menu.top >= slash.bottom && withinViewportAndOverlapping(slash, menu)
}

function above(slash: Box, menu: Box): boolean {
  return menu.bottom <= slash.top && withinViewportAndOverlapping(slash, menu)
}

/** Renders the editor at the given offsets of a page that is taller than the viewport. */
async function openAt(style: CSSProperties, items?: readonly SlashMenuItem[]) {
  const wrap = (content: ReactNode) => (
    <div style={{ ...style, paddingBottom: 2000 }}>
      <div data-testid="editor">{content}</div>
    </div>
  )
  const result = await renderMenu({ wrapContent: wrap, ...(items ? { items } : {}) })
  await placeCursor(result.editor, 'end')
  await type('/')
  await expectOpen(true)
  return result
}

async function scrollBy(pixels: number): Promise<void> {
  const before = window.scrollY
  window.scrollBy(0, pixels)
  await expect.poll(() => window.scrollY).toBe(before + pixels)
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
}

beforeEach(async () => {
  await page.viewport(1024, 800)
  window.scrollTo(0, 0)
})

afterEach(() => {
  window.scrollTo(0, 0)
})

describe('placement', () => {
  it('renders the menu into the body, where the editor container neither clips nor covers it', async () => {
    const clipping = (content: ReactNode) => (
      <div data-testid="clip" style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
        {content}
      </div>
    )
    const { editor, surface } = await renderMenu({ wrapContent: clipping })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)

    const menu = menuElement() as HTMLElement
    expect(document.body.contains(menu)).toBe(true)
    const shared: string[] = []
    for (let node = menu.parentElement; node; node = node.parentElement) {
      if (node.contains(surface)) shared.push(node.tagName)
    }
    expect(shared).toEqual(['BODY', 'HTML'])

    const clip = document.querySelector('[data-testid="clip"]') as HTMLElement
    const clipBox = clip.getBoundingClientRect()
    const box = menu.getBoundingClientRect()
    expect(box.bottom).toBeGreaterThan(clipBox.bottom + 10)
    const x = (box.left + box.right) / 2
    const y = (clipBox.bottom + box.bottom) / 2
    const topmost = document.elementFromPoint(x, y)
    expect(topmost === menu || menu.contains(topmost)).toBe(true)
  })

  it('keeps the menu above a container of the editor that has a z-index', async () => {
    const overlay = (content: ReactNode) => (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white' }}>
        {content}
      </div>
    )
    const { editor } = await renderMenu({ wrapContent: overlay })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)

    const menu = menuElement() as HTMLElement
    const box = menu.getBoundingClientRect()
    const topmost = document.elementFromPoint(
      (box.left + box.right) / 2,
      (box.top + box.bottom) / 2,
    )
    expect(topmost === menu || menu.contains(topmost)).toBe(true)
  })

  it('renders the menu into the container element', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    try {
      const { editor } = await renderMenu({ content: { container } })
      await placeCursor(editor, 'end')
      await type('/')
      await expectOpen(true)
      expect(container.contains(menuElement())).toBe(true)
    } finally {
      container.remove()
    }
  })

  it('places the menu below the slash, above it when there is more room above, and follows scrolling', async () => {
    const top = await openAt({ paddingTop: 100, paddingLeft: 100 })
    const naturalHeight = menuBox().bottom - menuBox().top
    expect(naturalHeight).toBeGreaterThan(100)
    expect(below(slashBox(top.surface), menuBox())).toBe(true)
    await scrollBy(50)
    await expect.poll(() => below(slashBox(top.surface), menuBox())).toBe(true)
    await top.unmount()
    window.scrollTo(0, 0)

    // The room below the slash is smaller than the natural height, and the room above larger.
    const bottom = await openAt({ paddingTop: 800 - naturalHeight / 2, paddingLeft: 100 })
    const slash = slashBox(bottom.surface)
    expect(800 - slash.bottom).toBeLessThan(naturalHeight)
    expect(slash.top).toBeGreaterThan(800 - slash.bottom)
    expect(above(slash, menuBox())).toBe(true)
    await scrollBy(50)
    const moved = slashBox(bottom.surface)
    expect(800 - moved.bottom).toBeLessThan(naturalHeight)
    await expect.poll(() => above(slashBox(bottom.surface), menuBox())).toBe(true)
    await bottom.unmount()
    window.scrollTo(0, 0)

    // Near the right edge of the viewport.
    const right = await openAt({ paddingTop: 100, paddingLeft: 1024 - 40 })
    expect(slashBox(right.surface).left).toBeGreaterThan(1024 - 60)
    expect(below(slashBox(right.surface), menuBox())).toBe(true)
    await scrollBy(50)
    await expect.poll(() => below(slashBox(right.surface), menuBox())).toBe(true)
  })

  it('limits the height to the viewport and keeps the highlighted item visible', async () => {
    await page.viewport(1024, 600)
    const items = Array.from({ length: 200 }, (_, index) => commandItem(`Command ${index + 1}`))
    await openAt({ paddingTop: 40, paddingLeft: 40 }, items)

    const menu = menuElement() as HTMLElement
    const box = menuBox()
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.bottom).toBeLessThanOrEqual(600)
    expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight)

    const visible = (option: HTMLElement) => {
      const outer = menu.getBoundingClientRect()
      const inner = option.getBoundingClientRect()
      const top = outer.top + menu.clientTop
      return inner.top >= top - 1 && inner.bottom <= top + menu.clientHeight + 1
    }

    await type('{ArrowUp}')
    const last = highlightedOption() as HTMLElement
    expect(last.textContent).toBe('Command 200')
    expect(visible(last)).toBe(true)

    await type('{ArrowDown}')
    const first = highlightedOption() as HTMLElement
    expect(first.textContent).toBe('Command 1')
    expect(visible(first)).toBe(true)
  })
})
