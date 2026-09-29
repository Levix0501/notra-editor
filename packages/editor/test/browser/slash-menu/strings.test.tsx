import { describe, expect, it } from 'vitest'
import type { NotraMessages, SlashMenuItem } from '../../../src'
import { locales } from '../../../src/messages'
import { beforeContent, exposedTexts } from '../render'
import {
  displayedTitles,
  doc,
  expectOpen,
  menuElement,
  paragraph,
  placeCursor,
  renderMenu,
  sections,
  type,
} from './helpers'

const { en, 'zh-CN': zhCN } = locales

/** The keys of the slash menu's built-in strings. */
const slashMenuKeys: Array<keyof NotraMessages> = [
  'slashMenuHint',
  'slashMenuLabel',
  'slashMenuEmpty',
  'blockGroupBasic',
  'blockText',
  'blockHeading1',
  'blockHeading2',
  'blockHeading3',
  'blockBulletList',
  'blockOrderedList',
  'blockQuote',
  'blockCodeBlock',
  'blockDivider',
]

const titleKeys: Array<keyof NotraMessages> = [
  'blockText',
  'blockHeading1',
  'blockHeading2',
  'blockHeading3',
  'blockBulletList',
  'blockOrderedList',
  'blockQuote',
  'blockCodeBlock',
  'blockDivider',
]

/** The shortcut hints of the default items, which are the same in every locale. */
const shortcutHints = ['#', '##', '###', '-', '1.', '>', '```', '---']

const markers = Object.fromEntries(
  Object.keys(en).map((key) => [key, `marker:${key}`]),
) as unknown as NotraMessages

describe('built-in strings of the slash menu', () => {
  it('are defined, non-empty, in en and zh-CN', () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort())
    for (const key of slashMenuKeys) {
      expect(Object.keys(en)).toContain(key)
      expect(en[key].trim()).not.toBe('')
      expect(zhCN[key].trim()).not.toBe('')
    }
    expect(titleKeys.map((key) => zhCN[key])).toEqual([
      '正文',
      '标题 1',
      '标题 2',
      '标题 3',
      '无序列表',
      '有序列表',
      '引用',
      '代码块',
      '分割线',
    ])
    expect(zhCN.blockGroupBasic).toBe('基础块')
    expect(zhCN.slashMenuEmpty).toBe('无结果')
    expect(zhCN.slashMenuHint).toBe('输入 / 唤出命令')
    expect(en.slashMenuHint).toBe('Type / for commands')
  })

  it('come from the messages prop, and together with the editor strings make up every string', async () => {
    const markerValues = Object.values(markers)
    const seen = new Set<string>()
    const record = (texts: string[]) => {
      for (const text of texts) {
        expect(markerValues).toContain(text)
        seen.add(text)
      }
    }

    const { editor, container } = await renderMenu({
      messages: markers,
      initialContent: doc(paragraph('Title')),
    })
    await placeCursor(editor, 'end')
    await type('{Enter}')
    // The empty-line hint.
    const hinted = Array.from(container.querySelectorAll('p')).map(beforeContent)
    expect(hinted).toEqual([null, markers.slashMenuHint])
    record(exposedTexts(container).filter((text) => text !== 'Title'))

    await type('/')
    await expectOpen(true)
    const menu = menuElement() as HTMLElement
    const menuTexts = exposedTexts(menu).filter((text) => !shortcutHints.includes(text))
    record(menuTexts)
    for (const key of [...titleKeys, 'blockGroupBasic', 'slashMenuLabel'] as const) {
      expect(menuTexts).toContain(markers[key])
    }

    await type('zzzz')
    await expect.poll(() => menuElement()?.textContent).toBe(markers.slashMenuEmpty)
    record(exposedTexts(menuElement() as HTMLElement))

    // An empty document shows the placeholder.
    const empty = await renderMenu({ messages: markers })
    record(exposedTexts(empty.container))

    expect(new Set(seen)).toEqual(new Set(markerValues))
  })

  it('follow changes of locale and messages while the menu is open', async () => {
    const { editor, update } = await renderMenu({ locale: 'en' })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)
    expect(displayedTitles()).toEqual(titleKeys.map((key) => en[key]))
    expect(sections().map((section) => section.heading)).toEqual([en.blockGroupBasic])

    await update({ locale: 'zh-CN' })
    expect(displayedTitles()).toEqual(titleKeys.map((key) => zhCN[key]))
    expect(sections().map((section) => section.heading)).toEqual([zhCN.blockGroupBasic])
    const label = document.querySelector('[role="listbox"]')?.getAttribute('aria-label')
    expect(label).toBe(zhCN.slashMenuLabel)

    const before = exposedTexts(menuElement() as HTMLElement)
    await update({ locale: 'zh-CN', messages: { blockQuote: 'Pull quote' } })
    const after = exposedTexts(menuElement() as HTMLElement)
    expect(after).toEqual(before.map((text) => (text === zhCN.blockQuote ? 'Pull quote' : text)))
    expect(after).toContain('Pull quote')
    expect(after).not.toContain(zhCN.blockQuote)
  })

  it('call title and group functions with the active strings', async () => {
    const titleCalls: NotraMessages[] = []
    const groupCalls: NotraMessages[] = []
    const item: SlashMenuItem = {
      id: 'dynamic',
      title: (messages) => {
        titleCalls.push(messages)
        return `Title ${messages.blockText}`
      },
      group: (messages) => {
        groupCalls.push(messages)
        return `Group ${messages.blockGroupBasic}`
      },
      command: () => {},
    }
    const { editor, update } = await renderMenu({ items: [item], locale: 'en' })
    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)

    expect(titleCalls.length).toBeGreaterThan(0)
    expect(groupCalls.length).toBeGreaterThan(0)
    for (const messages of [...titleCalls, ...groupCalls]) expect(messages).toEqual(en)
    expect(displayedTitles()).toEqual([`Title ${en.blockText}`])
    expect(sections()).toEqual([
      { heading: `Group ${en.blockGroupBasic}`, titles: [`Title ${en.blockText}`] },
    ])

    titleCalls.length = 0
    groupCalls.length = 0
    await update({ items: [item], locale: 'zh-CN' })
    expect(titleCalls.length).toBeGreaterThan(0)
    expect(groupCalls.length).toBeGreaterThan(0)
    for (const messages of [...titleCalls, ...groupCalls]) expect(messages).toEqual(zhCN)
    expect(displayedTitles()).toEqual([`Title ${zhCN.blockText}`])
    expect(sections()[0]?.heading).toBe(`Group ${zhCN.blockGroupBasic}`)
  })
})
