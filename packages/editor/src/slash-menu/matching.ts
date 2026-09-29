import type { NotraMessages } from '../messages'
import type { SlashMenuItem, SlashMenuText } from './types'

/** An item that the menu displays, with its resolved title and its position in display order. */
export interface DisplayedItem {
  item: SlashMenuItem
  title: string
  /** The position of the item among all displayed items, in display order. */
  index: number
}

/** A section of the displayed items: the items of one group, or those without a group. */
export interface DisplayedSection {
  /** A key that identifies the section among its siblings. */
  key: string
  /** The resolved group, or `null` for the items without a group. */
  heading: string | null
  items: DisplayedItem[]
}

/** Returns `value`, or what it returns for `messages` when it is a function. */
export function resolveText(value: SlashMenuText, messages: NotraMessages): string {
  return typeof value === 'function' ? value(messages) : value
}

function lowerCase(value: string): string {
  return value.toLowerCase()
}

/**
 * Returns the items that match `query`, ranked: first those whose title begins with the query,
 * then the others, each part in the order of `items`. Matching and ranking ignore case, and an
 * item matches when the query occurs in its title or in one of its keywords.
 */
export function rankItems(
  items: readonly SlashMenuItem[],
  query: string,
  messages: NotraMessages,
): Array<{ item: SlashMenuItem; title: string }> {
  const needle = lowerCase(query)
  const leading: Array<{ item: SlashMenuItem; title: string }> = []
  const others: Array<{ item: SlashMenuItem; title: string }> = []
  for (const item of items) {
    const title = resolveText(item.title, messages)
    const lowerTitle = lowerCase(title)
    if (lowerTitle.startsWith(needle)) {
      leading.push({ item, title })
    } else if (
      lowerTitle.includes(needle) ||
      (item.keywords ?? []).some(
        (keyword) => typeof keyword === 'string' && lowerCase(keyword).includes(needle),
      )
    ) {
      others.push({ item, title })
    }
  }
  return [...leading, ...others]
}

/**
 * Splits ranked items into sections: one for each resolved group and one for the items without
 * a group. Each section keeps the rank order of its items, and the sections follow the rank of
 * their first items.
 */
export function sectionItems(
  ranked: ReadonlyArray<{ item: SlashMenuItem; title: string }>,
  messages: NotraMessages,
): DisplayedSection[] {
  const sections = new Map<string, DisplayedSection>()
  for (const { item, title } of ranked) {
    const heading = item.group === undefined ? null : resolveText(item.group, messages)
    const key = heading === null ? 'ungrouped' : `group:${heading}`
    let section = sections.get(key)
    if (!section) {
      section = { key, heading, items: [] }
      sections.set(key, section)
    }
    section.items.push({ item, title, index: -1 })
  }
  const result = [...sections.values()]
  let index = 0
  for (const section of result) {
    for (const entry of section.items) {
      entry.index = index
      index += 1
    }
  }
  return result
}
