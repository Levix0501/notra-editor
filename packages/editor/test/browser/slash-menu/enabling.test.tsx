import type { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { defaultSlashMenuItems, NotraKit } from '../../../src'
import { locales } from '../../../src/messages'
import {
  commandItem,
  displayedTitles,
  doc,
  expectOpen,
  isOpen,
  paragraph,
  placeCursor,
  renderMenu,
  type,
} from './helpers'

const { en } = locales

const defaultTitles = [
  en.blockText,
  en.blockHeading1,
  en.blockHeading2,
  en.blockHeading3,
  en.blockBulletList,
  en.blockOrderedList,
  en.blockQuote,
  en.blockCodeBlock,
  en.blockDivider,
]

describe('enabling the slash menu', () => {
  it('opens the menu with the nine default items, without changing the extensions', async () => {
    const extensions = [NotraKit]
    const { editor } = await renderMenu({ extensions })
    expect(extensions).toEqual([NotraKit])
    await placeCursor(editor, 'end')
    await type('/')

    await expectOpen(true)
    expect(displayedTitles()).toEqual(defaultTitles)
    expect(defaultSlashMenuItems).toHaveLength(9)
  })

  it('displays exactly the items of the items prop', async () => {
    const { editor } = await renderMenu({ items: [commandItem('Only command')] })
    await placeCursor(editor, 'end')
    await type('/')

    await expectOpen(true)
    expect(displayedTitles()).toEqual(['Only command'])
  })

  it('opens no menu without SlashMenu.Root, and types a slash', async () => {
    const { editor } = await renderMenu({ slashMenu: false })
    await placeCursor(editor, 'end')
    await type('/')

    expect(isOpen()).toBe(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('/')))
  })

  it('opens no menu after SlashMenu.Root unmounts, and keeps the editor and document', async () => {
    const seen = new Set<Editor>()
    const initialContent = doc(paragraph('Kept'), paragraph())
    const { editor, currentEditor, update } = await renderMenu({ initialContent, slashMenu: false })
    seen.add(currentEditor())
    const before = editor.getJSON()

    await update({ initialContent, slashMenu: true })
    seen.add(currentEditor())
    expect(editor.getJSON()).toEqual(before)

    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    await type('{Escape}{Backspace}')
    await expectOpen(false)
    expect(editor.getJSON()).toEqual(before)

    await update({ initialContent, slashMenu: false })
    seen.add(currentEditor())
    expect(editor.getJSON()).toEqual(before)

    await placeCursor(editor, 'end')
    await type('/')
    expect(isOpen()).toBe(false)
    expect(editor.getJSON()).toEqual(doc(paragraph('Kept'), paragraph('/')))
    expect(seen.size).toBe(1)
  })
})
