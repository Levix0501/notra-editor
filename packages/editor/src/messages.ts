import type { Editor } from '@tiptap/core'
import { en } from './locales/en'
import { zhCN } from './locales/zh-cn'

/** A locale whose built-in strings ship with the package. */
export type NotraLocale = 'en' | 'zh-CN'

/** The built-in strings that the package renders or exposes to assistive technology. */
export interface NotraMessages {
  /** Placeholder shown while the document is empty. */
  placeholder: string
  /** Accessible name of the editable surface. */
  editorLabel: string
}

/** The built-in strings of every supported locale. */
export const locales: Readonly<Record<NotraLocale, NotraMessages>> = {
  en,
  'zh-CN': zhCN,
}

/**
 * Returns the strings of `locale` with `overrides` applied. Unknown locales fall back to `en`,
 * and override values that are not strings are ignored.
 */
export function resolveMessages(
  locale: NotraLocale,
  overrides?: Partial<NotraMessages>,
): NotraMessages {
  const base = Object.hasOwn(locales, locale) ? locales[locale] : locales.en
  const resolved: NotraMessages = { ...base }
  if (overrides) {
    for (const key of Object.keys(base) as (keyof NotraMessages)[]) {
      const value = overrides[key]
      if (typeof value === 'string') resolved[key] = value
    }
  }
  return resolved
}

const messageSources = new WeakMap<Editor, () => NotraMessages>()

/** Connects an editor to the source of its current built-in strings. */
export function bindEditorMessages(editor: Editor, source: () => NotraMessages): void {
  messageSources.set(editor, source)
}

/**
 * Returns the built-in strings that currently apply to `editor`, or the `en` strings when the
 * editor was not created by `NotraEditor.Root`.
 */
export function getEditorMessages(editor: Editor): NotraMessages {
  return messageSources.get(editor)?.() ?? locales.en
}
