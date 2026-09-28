import { type JSONContent, Node } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { defaultSlashMenuItems, type SlashMenuItem } from '../../../src'
import { locales } from '../../../src/messages'
import {
  blockquote,
  bulletList,
  click,
  codeBlock,
  displayedTitles,
  doc,
  expectOpen,
  heading,
  horizontalRule,
  listItem,
  type MenuOptions,
  options,
  orderedList,
  paragraph,
  placeCursor,
  renderMenu,
  selectionOf,
  titleOf,
  type,
  undo,
  withKit,
} from './helpers'

const { en } = locales

interface Outcome {
  json: JSONContent
  selection: { from: number; to: number }
}

/** Highlights the item titled `title` with ArrowDown and selects it with Enter. */
async function selectWithKeys(title: string): Promise<void> {
  const index = displayedTitles().indexOf(title)
  expect(index, `${title} is displayed`).toBeGreaterThanOrEqual(0)
  await type(`${'{ArrowDown}'.repeat(index)}{Enter}`)
}

/**
 * Types `/` at `cursor`, selects the item titled `title`, and checks focus and a single undo.
 */
async function selectItem(
  menu: MenuOptions,
  cursor: number | 'end',
  title: string,
  how: 'keys' | 'click' = 'keys',
): Promise<Outcome> {
  const { editor, surface } = await renderMenu(menu)
  await placeCursor(editor, cursor)
  await type('/')
  await expectOpen(true)
  const before = editor.getJSON()

  if (how === 'keys') {
    await selectWithKeys(title)
  } else {
    const option = options().find((element) => titleOf(element) === title)
    if (!option) throw new Error(`${title} is not displayed`)
    await click(option)
  }
  await expectOpen(false)
  const outcome = { json: editor.getJSON(), selection: selectionOf(editor) }

  expect(editor.view.hasFocus()).toBe(true)
  expect(document.activeElement).toBe(surface)
  await undo()
  expect(editor.getJSON()).toEqual(before)
  return outcome
}

/** Types `keys` at `cursor` and returns the result. */
async function typeShortcut(
  menu: MenuOptions,
  cursor: number | 'end',
  keys: string,
): Promise<Outcome> {
  const { editor } = await renderMenu(menu)
  await placeCursor(editor, cursor)
  await type(keys)
  return { json: editor.getJSON(), selection: selectionOf(editor) }
}

const shortcuts: Array<[string, string]> = [
  [en.blockHeading1, '# '],
  [en.blockHeading2, '## '],
  [en.blockHeading3, '### '],
  [en.blockBulletList, '- '],
  [en.blockOrderedList, '1. '],
  [en.blockQuote, '> '],
  [en.blockCodeBlock, '``` '],
  [en.blockDivider, '---'],
]

const quote = defaultSlashMenuItems.find((item) => item.id === 'blockquote') as SlashMenuItem
const quoteLike: SlashMenuItem = {
  id: 'my-quote',
  title: 'My quote',
  block: structuredClone(quote.block) as JSONContent,
}

describe('selecting a block item in a bare paragraph', () => {
  const afterText = { initialContent: doc(paragraph('abc'), paragraph()) }

  it.each(shortcuts)('makes %s the same as typing %j', async (title, keys) => {
    const selected = await selectItem(afterText, 'end', title)
    const typed = await typeShortcut(afterText, 'end', keys)
    expect(selected).toEqual(typed)
  })

  const following: Array<[string, string, JSONContent, JSONContent[]]> = [
    [
      en.blockBulletList,
      '- ',
      bulletList(listItem(paragraph('a'))),
      [bulletList(listItem(paragraph('a')), listItem(paragraph()))],
    ],
    [
      en.blockOrderedList,
      '1. ',
      orderedList(listItem(paragraph('a'))),
      [orderedList(listItem(paragraph('a'))), orderedList(listItem(paragraph()))],
    ],
    [en.blockQuote, '> ', blockquote(paragraph('a')), [blockquote(paragraph('a'), paragraph())]],
  ]

  it.each(following)(
    'makes %s after the same block the same as typing %j',
    async (title, keys, previous, result) => {
      const menu = { initialContent: doc(previous, paragraph()) }
      const selected = await selectItem(menu, 'end', title)
      const typed = await typeShortcut(menu, 'end', keys)
      expect(selected).toEqual(typed)
      expect(selected.json).toEqual(doc(...result))
    },
  )

  it('makes an item with the block of Quote the same as Quote', async () => {
    for (const previous of [paragraph('abc'), blockquote(paragraph('a'))]) {
      const initialContent = doc(previous, paragraph())
      const selected = await selectItem({ initialContent, items: [quoteLike] }, 'end', 'My quote')
      const reference = await selectItem({ initialContent }, 'end', en.blockQuote)
      expect(selected).toEqual(reference)
    }
  })
})

describe('selecting a block item in a bare heading', () => {
  const inHeading = { initialContent: doc(heading(1)) }

  it('turns the heading into an empty paragraph with Text', async () => {
    const outcome = await selectItem(inHeading, 1, en.blockText)
    expect(outcome).toEqual({ json: doc(paragraph()), selection: { from: 1, to: 1 } })
  })

  it('turns the heading into a blockquote with Quote', async () => {
    const outcome = await selectItem(inHeading, 1, en.blockQuote)
    expect(outcome).toEqual({
      json: doc(blockquote(paragraph())),
      selection: { from: 2, to: 2 },
    })
    const custom = await selectItem({ ...inHeading, items: [quoteLike] }, 1, 'My quote')
    expect(custom).toEqual(outcome)
  })
})

describe('selecting a block item after other text', () => {
  const withText = { initialContent: doc(paragraph('abc ')) }
  const expected: Array<[string, JSONContent[], number]> = [
    [en.blockText, [paragraph()], 7],
    [en.blockHeading1, [heading(1)], 7],
    [en.blockHeading2, [heading(2)], 7],
    [en.blockHeading3, [heading(3)], 7],
    [en.blockBulletList, [bulletList(listItem(paragraph()))], 9],
    [en.blockOrderedList, [orderedList(listItem(paragraph()))], 9],
    [en.blockQuote, [blockquote(paragraph())], 8],
    [en.blockCodeBlock, [codeBlock()], 7],
    [en.blockDivider, [horizontalRule, paragraph()], 8],
  ]

  it.each(expected)('inserts %s after the paragraph', async (title, blocks, cursor) => {
    const outcome = await selectItem(withText, 'end', title)
    expect(outcome).toEqual({
      json: doc(paragraph('abc '), ...blocks),
      selection: { from: cursor, to: cursor },
    })
  })

  it('inserts Heading 1 after the paragraph within a list item', async () => {
    const outcome = await selectItem(
      { initialContent: doc(bulletList(listItem(paragraph('abc ')))) },
      'end',
      en.blockHeading1,
    )
    expect(outcome).toEqual({
      json: doc(bulletList(listItem(paragraph('abc '), heading(1)))),
      selection: { from: 9, to: 9 },
    })
  })

  it('inserts Code block after the paragraph within a blockquote', async () => {
    const outcome = await selectItem(
      { initialContent: doc(blockquote(paragraph('abc '))) },
      'end',
      en.blockCodeBlock,
    )
    expect(outcome).toEqual({
      json: doc(blockquote(paragraph('abc '), codeBlock())),
      selection: { from: 8, to: 8 },
    })
  })

  it('makes an item with the block of Quote the same as Quote', async () => {
    const selected = await selectItem({ ...withText, items: [quoteLike] }, 'end', 'My quote')
    const reference = await selectItem(withText, 'end', en.blockQuote)
    expect(selected).toEqual(reference)
  })

  it('selects a clicked item the same way', async () => {
    const outcome = await selectItem(withText, 'end', en.blockBulletList, 'click')
    expect(outcome).toEqual({
      json: doc(paragraph('abc '), bulletList(listItem(paragraph()))),
      selection: { from: 9, to: 9 },
    })
  })
})

describe('selecting a block item of a custom node', () => {
  const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'paragraph+',
    parseHTML: () => [{ tag: 'aside[data-callout]' }],
    renderHTML: () => ['aside', { 'data-callout': '' }, 0],
  })
  const calloutItem: SlashMenuItem = {
    id: 'callout',
    title: 'Callout',
    block: { type: 'callout', content: [{ type: 'paragraph' }] },
  }
  const callout = (...content: JSONContent[]): JSONContent => ({ type: 'callout', content })

  it('puts the callout in place of a bare paragraph', async () => {
    const outcome = await selectItem(
      { extensions: withKit(Callout), items: [calloutItem] },
      'end',
      'Callout',
    )
    expect(outcome).toEqual({ json: doc(callout(paragraph())), selection: { from: 2, to: 2 } })
  })

  it('puts the callout after a paragraph with other text', async () => {
    const outcome = await selectItem(
      {
        extensions: withKit(Callout),
        items: [calloutItem],
        initialContent: doc(paragraph('abc ')),
      },
      'end',
      'Callout',
    )
    expect(outcome).toEqual({
      json: doc(paragraph('abc '), callout(paragraph())),
      selection: { from: 8, to: 8 },
    })
  })
})
