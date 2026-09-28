import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { defaultSlashMenuItems, type NotraLocale } from '../../../src'
import { locales } from '../../../src/messages'
import {
  displayedTitles,
  doc,
  expectOpen,
  options,
  paragraph,
  placeCursor,
  renderMenu,
  run,
  sections,
  titleOf,
  type,
} from './helpers'

const { en, 'zh-CN': zhCN } = locales

const titleKeys = [
  'blockText',
  'blockHeading1',
  'blockHeading2',
  'blockHeading3',
  'blockBulletList',
  'blockOrderedList',
  'blockQuote',
  'blockCodeBlock',
  'blockDivider',
] as const

const hints = [null, '#', '##', '###', '-', '1.', '>', '```', '---']

const pinyin: Array<[string, string]> = [
  ['zhengwen', 'zw'],
  ['biaoti', 'bt'],
  ['biaoti', 'bt'],
  ['biaoti', 'bt'],
  ['wuxuliebiao', 'wxlb'],
  ['youxuliebiao', 'yxlb'],
  ['yinyong', 'yy'],
  ['daimakuai', 'dmk'],
  ['fengexian', 'fgx'],
]

function containsText(node: JSONContent): boolean {
  return typeof node.text === 'string' || (node.content ?? []).some(containsText)
}

describe('default items', () => {
  it('are nine plain block items for the block types of NotraKit', () => {
    expect(Array.isArray(defaultSlashMenuItems)).toBe(true)
    expect(defaultSlashMenuItems).toHaveLength(9)
    const ids = defaultSlashMenuItems.map((item) => item.id)
    expect(new Set(ids).size).toBe(9)
    for (const item of defaultSlashMenuItems) {
      expect(Object.getPrototypeOf(item)).toBe(Object.prototype)
      expect(item.block).toBeDefined()
      expect(item).not.toHaveProperty('command')
      expect(containsText(item.block as JSONContent)).toBe(false)
      expect(Array.isArray(item.keywords)).toBe(true)
      for (const keyword of item.keywords ?? []) expect(typeof keyword).toBe('string')
    }
    expect(defaultSlashMenuItems.map((item) => item.block?.type)).toEqual([
      'paragraph',
      'heading',
      'heading',
      'heading',
      'bulletList',
      'orderedList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
    ])
    expect(defaultSlashMenuItems.slice(1, 4).map((item) => item.block?.attrs?.level)).toEqual([
      1, 2, 3,
    ])
    expect(defaultSlashMenuItems.find((item) => item.block?.type === 'codeBlock')?.id).toBe(
      'codeBlock',
    )
  })

  it('carry the same keywords in every locale, including both titles and the Pinyin', () => {
    defaultSlashMenuItems.forEach((item, index) => {
      const key = titleKeys[index] as (typeof titleKeys)[number]
      const [full, initials] = pinyin[index] as [string, string]
      expect(item.keywords).toEqual(expect.arrayContaining([en[key], zhCN[key], full, initials]))
    })
    expect(defaultSlashMenuItems[1]?.keywords).toContain('h1')
    expect(defaultSlashMenuItems[2]?.keywords).toContain('h2')
    expect(defaultSlashMenuItems[3]?.keywords).toContain('h3')
  })

  it.each(['zh-CN', 'en'] as NotraLocale[])(
    'show their %s titles, one group, icons and the same hints',
    async (locale) => {
      const messages = locale === 'en' ? en : zhCN
      const { editor } = await renderMenu({ locale })
      await placeCursor(editor, 'end')
      await type('/')
      await expectOpen(true)

      const titles = titleKeys.map((key) => messages[key])
      expect(sections()).toEqual([{ heading: messages.blockGroupBasic, titles }])
      const all = options()
      expect(all.map(titleOf)).toEqual(titles)
      expect(
        all.map(
          (option) =>
            option.querySelector('[data-slot="slash-menu-item-hint"]')?.textContent ?? null,
        ),
      ).toEqual(hints)
      for (const option of all) {
        expect(option.querySelector('svg')?.classList.contains('lucide')).toBe(true)
      }
    },
  )

  it.each(['en', 'zh-CN'] as NotraLocale[])(
    'match their titles and Pinyin keywords with the locale %s',
    async (locale) => {
      const messages = locale === 'en' ? en : zhCN
      const { editor } = await renderMenu({ locale })
      const displays = async (query: string, title: string) => {
        await run(() => {
          editor.commands.setContent(doc(paragraph()))
        })
        await placeCursor(editor, 'end')
        await type(`/${query}`)
        await expectOpen(true)
        expect(displayedTitles(), `${query} displays ${title}`).toContain(title)
        await type('{Escape}')
      }

      for (const [index, key] of titleKeys.entries()) {
        const title = messages[key]
        const [full, initials] = pinyin[index] as [string, string]
        for (const query of [en[key], zhCN[key], full, initials]) await displays(query, title)
      }
      await displays('h1', messages.blockHeading1)
      await displays('h2', messages.blockHeading2)
      await displays('h3', messages.blockHeading3)
    },
  )
})
