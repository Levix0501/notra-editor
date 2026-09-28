import { describe, expect, it } from 'vitest'
import { defaultSlashMenuItems, NotraKit, type SlashMenuItem } from '../../../src'
import { locales } from '../../../src/messages'
import {
  bulletList,
  commandItem,
  displayedTitles,
  doc,
  expectOpen,
  listItem,
  paragraph,
  placeCursor,
  renderMenu,
  type,
} from './helpers'

const { en } = locales

const allTitles = [
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

describe('available items', () => {
  it('hides Code block when the editor has no code blocks', async () => {
    const { editor } = await renderMenu({ extensions: [NotraKit.configure({ codeBlock: false })] })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual(allTitles.filter((title) => title !== en.blockCodeBlock))
  })

  it('hides the headings whose level is not configured', async () => {
    const { editor } = await renderMenu({
      extensions: [NotraKit.configure({ heading: { levels: [1, 2] } })],
    })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    const titles = displayedTitles()
    expect(titles).toContain(en.blockHeading1)
    expect(titles).toContain(en.blockHeading2)
    expect(titles).not.toContain(en.blockHeading3)
  })

  it('offers only Text in the empty paragraph of a list item', async () => {
    const { editor } = await renderMenu({ initialContent: doc(bulletList(listItem(paragraph()))) })
    await placeCursor(editor, 3)
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual([en.blockText])
  })

  it('offers every default item after the text of a list item', async () => {
    const { editor } = await renderMenu({
      initialContent: doc(bulletList(listItem(paragraph('abc ')))),
    })
    await placeCursor(editor, 7)
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual(allTitles)
  })

  it('hides a block item whose block type the schema lacks', async () => {
    const unknown: SlashMenuItem = {
      id: 'unknown',
      title: 'Unknown block',
      block: { type: 'unknownNode' },
    }
    const { editor } = await renderMenu({ items: [unknown, commandItem('Command')] })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual(['Command'])
  })

  it('hides a block item whose content the schema lacks', async () => {
    const nested: SlashMenuItem = {
      id: 'nested',
      title: 'Nested unknown',
      block: { type: 'blockquote', content: [{ type: 'unknownNode' }] },
    }
    const { editor } = await renderMenu({ items: [nested, ...defaultSlashMenuItems] })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual(allTitles)
  })
})
