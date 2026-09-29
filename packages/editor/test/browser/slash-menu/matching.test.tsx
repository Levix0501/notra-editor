import { describe, expect, it } from 'vitest'
import {
  commandItem,
  displayedTitles,
  expectOpen,
  isOpen,
  placeCursor,
  renderMenu,
  sections,
  type,
} from './helpers'

const matchingItems = [
  commandItem('Alpha beta'),
  commandItem('Beta'),
  commandItem('Gamma', { keywords: ['alphabet'] }),
  commandItem('Delta'),
]

const groupedItems = [
  commandItem('Wx', { group: 'G1' }),
  commandItem('Xy', { group: 'G2' }),
  commandItem('Yz', { group: 'G1' }),
  commandItem('Zq'),
]

async function openWith(items: typeof matchingItems, query = ''): Promise<void> {
  const { editor } = await renderMenu({ items })
  await placeCursor(editor, 'end')
  await type(`/${query}`)
  await expectOpen(true)
}

describe('matching the query', () => {
  it('ranks the items whose title begins with the query first', async () => {
    await openWith(matchingItems, 'bet')
    expect(displayedTitles()).toEqual(['Beta', 'Alpha beta', 'Gamma'])
  })

  it('ignores case', async () => {
    await openWith(matchingItems, 'BET')
    expect(displayedTitles()).toEqual(['Beta', 'Alpha beta', 'Gamma'])
  })

  it('keeps a space in the query while items are displayed', async () => {
    await openWith(matchingItems, 'alpha')
    expect(displayedTitles()).toEqual(['Alpha beta', 'Gamma'])
    await type(' ')
    expect(isOpen()).toBe(true)
    await type('b')
    expect(isOpen()).toBe(true)
    expect(displayedTitles()).toEqual(['Alpha beta'])
  })

  it('displays every item in item-list order for an empty query', async () => {
    await openWith(matchingItems)
    expect(displayedTitles()).toEqual(['Alpha beta', 'Beta', 'Gamma', 'Delta'])
  })
})

describe('groups', () => {
  it('shows a section per group, in the order of their first items', async () => {
    await openWith(groupedItems)
    expect(sections()).toEqual([
      { heading: 'G1', titles: ['Wx', 'Yz'] },
      { heading: 'G2', titles: ['Xy'] },
      { heading: null, titles: ['Zq'] },
    ])
    expect(displayedTitles()).toEqual(['Wx', 'Yz', 'Xy', 'Zq'])
  })

  it('orders the sections by the rank of their first items', async () => {
    await openWith(groupedItems, 'x')
    expect(sections()).toEqual([
      { heading: 'G2', titles: ['Xy'] },
      { heading: 'G1', titles: ['Wx'] },
    ])
  })
})
