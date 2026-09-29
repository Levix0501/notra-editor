import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { locales } from '../../../src/messages'
import {
  bulletList,
  doc,
  expectOpen,
  heading,
  highlightedTitle,
  isOpen,
  listItem,
  paragraph,
  placeCursor,
  renderMenu,
  type,
} from './helpers'

const { en } = locales

describe('keyboard', () => {
  it('moves the highlight with ArrowDown and ArrowUp, wrapping around, without editing', async () => {
    const { editor } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    const json = editor.getJSON()

    expect(highlightedTitle()).toBe(en.blockText)
    await type('{ArrowDown}'.repeat(8))
    expect(highlightedTitle()).toBe(en.blockDivider)
    await type('{ArrowDown}')
    expect(highlightedTitle()).toBe(en.blockText)
    await type('{ArrowUp}')
    expect(highlightedTitle()).toBe(en.blockDivider)
    expect(editor.getJSON()).toEqual(json)
    expect(isOpen()).toBe(true)
  })

  it('selects the highlighted item with Enter and adds no other paragraph', async () => {
    const { editor } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/{ArrowDown}{Enter}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(heading(1)))
  })

  it('selects the highlighted item with Tab without indenting the list item', async () => {
    const { editor } = await renderMenu({
      initialContent: doc(bulletList(listItem(paragraph('one')), listItem(paragraph('abc ')))),
    })
    await placeCursor(editor, 'end')
    await type('/{ArrowDown}{Tab}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(
      doc(bulletList(listItem(paragraph('one')), listItem(paragraph('abc '), heading(1)))),
    )
  })

  it('highlights the first displayed item whenever the query changes', async () => {
    const { editor } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/{ArrowDown}{ArrowDown}')
    expect(highlightedTitle()).toBe(en.blockHeading2)
    await type('e')
    expect(highlightedTitle()).not.toBeNull()
    const first = document.querySelector('[role="option"]')
    expect(first?.getAttribute('aria-selected')).toBe('true')
  })

  it('leaves Enter to the editor while no item is displayed', async () => {
    const { editor } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/zzzz')
    await expectOpen(true)
    expect(highlightedTitle()).toBeNull()
    await type('{Enter}')
    expect(editor.getJSON()).toEqual(doc(paragraph('/zzzz'), paragraph()))
  })

  it('ignores an Enter that is part of an input method composition', async () => {
    const { editor, surface } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    const json = editor.getJSON()

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      isComposing: true,
      bubbles: true,
      cancelable: true,
    })
    await act(async () => {
      surface.dispatchEvent(event)
    })

    expect(editor.getJSON()).toEqual(json)
    expect(isOpen()).toBe(true)
    expect(highlightedTitle()).toBe(en.blockText)
  })
})
