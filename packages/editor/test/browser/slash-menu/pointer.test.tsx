import { describe, expect, it } from 'vitest'
import { locales } from '../../../src/messages'
import {
  bulletList,
  click,
  doc,
  expectOpen,
  highlightedTitle,
  hover,
  listItem,
  options,
  paragraph,
  placeCursor,
  renderMenu,
  titleOf,
  type,
} from './helpers'

const { en } = locales

describe('pointer', () => {
  it('highlights the item under the pointer and selects a clicked item', async () => {
    const { editor, surface } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)

    const third = options()[2] as HTMLElement
    await hover(third)
    expect(highlightedTitle()).toBe(titleOf(third))
    expect(titleOf(third)).toBe(en.blockHeading2)

    const fifth = options()[4] as HTMLElement
    expect(titleOf(fifth)).toBe(en.blockBulletList)
    await click(fifth)
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(doc(bulletList(listItem(paragraph()))))
    expect(editor.state.selection.from).toBe(3)
    expect(document.activeElement).toBe(surface)
  })
})
