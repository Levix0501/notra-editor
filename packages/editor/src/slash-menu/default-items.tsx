'use client'

import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  SquareCode,
  TextQuote,
  Type,
} from 'lucide-react'
import { locales, type NotraMessages } from '../messages'
import type { SlashMenuItem } from './types'

type TitleKey = keyof NotraMessages

/**
 * Returns the keywords of a default item: its English and Chinese titles, the Pinyin of the
 * Chinese title and its initials, and further aliases. They are the same in every locale.
 */
function keywords(title: TitleKey, pinyin: string[], aliases: string[] = []): string[] {
  return [
    locales.en[title],
    locales['zh-CN'][title],
    pinyin.join(''),
    pinyin.map((syllable) => syllable[0]).join(''),
    ...aliases,
  ]
}

const group = (messages: NotraMessages): string => messages.blockGroupBasic

/**
 * The default items of the slash menu, one for each block type of `NotraKit`. Combine them with
 * your own items using array operations, for example
 * `[...defaultSlashMenuItems.filter((item) => item.id !== 'codeBlock'), myItem]`.
 */
export const defaultSlashMenuItems: readonly SlashMenuItem[] = Object.freeze([
  {
    id: 'paragraph',
    title: (messages: NotraMessages) => messages.blockText,
    keywords: keywords('blockText', ['zheng', 'wen'], ['paragraph']),
    icon: <Type />,
    group,
    block: { type: 'paragraph' },
  },
  {
    id: 'heading1',
    title: (messages: NotraMessages) => messages.blockHeading1,
    keywords: keywords('blockHeading1', ['biao', 'ti'], ['h1']),
    icon: <Heading1 />,
    hint: '#',
    group,
    block: { type: 'heading', attrs: { level: 1 } },
  },
  {
    id: 'heading2',
    title: (messages: NotraMessages) => messages.blockHeading2,
    keywords: keywords('blockHeading2', ['biao', 'ti'], ['h2']),
    icon: <Heading2 />,
    hint: '##',
    group,
    block: { type: 'heading', attrs: { level: 2 } },
  },
  {
    id: 'heading3',
    title: (messages: NotraMessages) => messages.blockHeading3,
    keywords: keywords('blockHeading3', ['biao', 'ti'], ['h3']),
    icon: <Heading3 />,
    hint: '###',
    group,
    block: { type: 'heading', attrs: { level: 3 } },
  },
  {
    id: 'bulletList',
    title: (messages: NotraMessages) => messages.blockBulletList,
    keywords: keywords('blockBulletList', ['wu', 'xu', 'lie', 'biao'], ['bullet', 'ul']),
    icon: <List />,
    hint: '-',
    group,
    block: {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
    },
  },
  {
    id: 'orderedList',
    title: (messages: NotraMessages) => messages.blockOrderedList,
    keywords: keywords('blockOrderedList', ['you', 'xu', 'lie', 'biao'], ['ordered', 'ol']),
    icon: <ListOrdered />,
    hint: '1.',
    group,
    block: {
      type: 'orderedList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
    },
  },
  {
    id: 'blockquote',
    title: (messages: NotraMessages) => messages.blockQuote,
    keywords: keywords('blockQuote', ['yin', 'yong'], ['blockquote']),
    icon: <TextQuote />,
    hint: '>',
    group,
    block: { type: 'blockquote', content: [{ type: 'paragraph' }] },
  },
  {
    id: 'codeBlock',
    title: (messages: NotraMessages) => messages.blockCodeBlock,
    keywords: keywords('blockCodeBlock', ['dai', 'ma', 'kuai'], ['code']),
    icon: <SquareCode />,
    hint: '```',
    group,
    block: { type: 'codeBlock' },
  },
  {
    id: 'horizontalRule',
    title: (messages: NotraMessages) => messages.blockDivider,
    keywords: keywords('blockDivider', ['fen', 'ge', 'xian'], ['hr', 'separator']),
    icon: <Minus />,
    hint: '---',
    group,
    block: { type: 'horizontalRule' },
  },
] satisfies SlashMenuItem[])
