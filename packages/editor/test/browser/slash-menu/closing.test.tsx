import { describe, expect, it } from 'vitest'
import {
  click,
  doc,
  expectOpen,
  isOpen,
  paragraph,
  pause,
  placeCursor,
  renderMenu,
  text,
  type,
} from './helpers'

async function openAndType(
  keys: string,
  initial = doc(paragraph()),
  cursor: number | 'end' = 'end',
) {
  const result = await renderMenu({ initialContent: initial })
  await placeCursor(result.editor, cursor)
  await type(keys)
  return result
}

describe('closing the slash menu', () => {
  it('closes with Escape and keeps the typed text', async () => {
    const { editor } = await openAndType('/he')
    await expectOpen(true)
    await type('{Escape}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('/he')))
  })

  it('closes when the cursor moves before the trigger slash', async () => {
    const { editor } = await openAndType('/he')
    for (const cursor of [3, 2, 1]) {
      await pause()
      await type('{ArrowLeft}')
      await expect.poll(() => editor.state.selection.from).toBe(cursor)
      expect(isOpen()).toBe(cursor > 1)
    }
    expect(editor.getJSON()).toEqual(doc(paragraph('/he')))
  })

  it('closes when the trigger slash is deleted', async () => {
    const { editor } = await openAndType('/he')
    await type('{Backspace}{Backspace}')
    await expectOpen(true)
    await type('{Backspace}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph()))
  })

  it('closes when the pointer is pressed outside the menu and the editable surface', async () => {
    const outside = document.createElement('button')
    outside.textContent = 'Outside'
    document.body.append(outside)
    try {
      const { editor } = await openAndType('/he')
      await expectOpen(true)
      await click(outside)
      await expectOpen(false)
      expect(editor.getJSON()).toEqual(doc(paragraph('/he')))
    } finally {
      outside.remove()
    }
  })

  it('stays open when the pointer is pressed on the menu', async () => {
    const { editor } = await openAndType('/he')
    const menu = document.querySelector('[data-slot="slash-menu-content"]') as HTMLElement
    await click(menu, { position: { x: 2, y: 2 } })
    await expectOpen(true)
    expect(editor.getJSON()).toEqual(doc(paragraph('/he')))
  })

  it('stays open when the pointer is pressed within the query', async () => {
    const { editor, surface } = await openAndType('/he')
    await expectOpen(true)
    expect(editor.state.selection.from).toBe(4)

    // Press on the right part of the query's `h`, which puts the cursor directly after it.
    const text = surface.querySelector('p')?.firstChild
    if (!(text instanceof Text)) throw new Error('the paragraph holds no text node')
    const range = document.createRange()
    range.setStart(text, 1)
    range.setEnd(text, 2)
    const h = range.getBoundingClientRect()
    const box = surface.getBoundingClientRect()
    await click(surface, {
      position: { x: h.left + h.width * 0.75 - box.left, y: (h.top + h.bottom) / 2 - box.top },
    })

    await expect.poll(() => editor.state.selection.from).toBe(3)
    expect(isOpen()).toBe(true)
    expect(editor.getJSON()).toEqual(doc(paragraph('/he')))
  })

  it('closes when the cursor moves past the end of the query', async () => {
    const { editor } = await openAndType('/h', doc(paragraph('abc')), 1)
    await expectOpen(true)
    await type('{ArrowRight}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('/habc')))
  })

  it('closes when whitespace directly follows the trigger slash', async () => {
    const { editor } = await openAndType('/')
    await expectOpen(true)
    await type(' ')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('/ ')))
  })

  it('closes when whitespace is typed while no item is displayed', async () => {
    const { editor } = await openAndType('/zzzz')
    await expectOpen(true)
    await type(' ')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('/zzzz ')))
  })

  it('closes when a line break is inserted into the query', async () => {
    const { editor } = await openAndType('/he')
    await expectOpen(true)
    await type('{Shift>}{Enter}{/Shift}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(
      doc({ type: 'paragraph', content: [text('/he'), { type: 'hardBreak' }] }),
    )
  })

  it('closes after an item is selected', async () => {
    await openAndType('/')
    await expectOpen(true)
    await type('{Enter}')
    await expectOpen(false)
  })
})
