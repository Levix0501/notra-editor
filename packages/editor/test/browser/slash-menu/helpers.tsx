import type { Editor, Extensions, JSONContent } from '@tiptap/core'
import { act, type ReactNode } from 'react'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  NotraEditor,
  type NotraEditorRootProps,
  NotraKit,
  SlashMenu,
  type SlashMenuContentProps,
  type SlashMenuItem,
  useNotraEditor,
} from '../../../src'
import { focusEditor, type RenderResult, render } from '../render'

/** Options of a composition that `renderMenu` renders. */
export interface MenuOptions extends Omit<NotraEditorRootProps, 'children'> {
  /** Renders no `SlashMenu.Root` when false. */
  slashMenu?: boolean
  /** The `items` prop of `SlashMenu.Root`; omitted when undefined. */
  items?: readonly SlashMenuItem[]
  /** Props of `SlashMenu.Content`. */
  content?: Omit<SlashMenuContentProps, 'children'>
  /** The `className` of `SlashMenu.List`. */
  listClassName?: string
  /** The `className` of `SlashMenu.Empty`. */
  emptyClassName?: string
  /** The children of `SlashMenu.Empty`. */
  emptyChildren?: ReactNode
  /** Renders each item instead of `<SlashMenu.Item item={item} />`. */
  renderItem?: (item: SlashMenuItem) => ReactNode
  /** Wraps `NotraEditor.Content`. */
  wrapContent?: (content: ReactNode) => ReactNode
}

function EditorProbe({ onEditor }: { onEditor: (editor: Editor) => void }): null {
  onEditor(useNotraEditor())
  return null
}

/** Returns the elements of a composition that differs from the reference composition as stated. */
export function composition(options: MenuOptions, onEditor: (editor: Editor) => void): ReactNode {
  const {
    slashMenu = true,
    items,
    content,
    listClassName,
    emptyClassName,
    emptyChildren,
    renderItem,
    wrapContent = (node) => node,
    extensions = [NotraKit],
    ...rootProps
  } = options
  return (
    <NotraEditor.Root extensions={extensions} {...rootProps}>
      <EditorProbe onEditor={onEditor} />
      {wrapContent(<NotraEditor.Content />)}
      {slashMenu ? (
        <SlashMenu.Root {...(items === undefined ? {} : { items })}>
          <SlashMenu.Content {...content}>
            <SlashMenu.Empty className={emptyClassName}>{emptyChildren}</SlashMenu.Empty>
            <SlashMenu.List className={listClassName}>
              {(item) => (renderItem ? renderItem(item) : <SlashMenu.Item item={item} />)}
            </SlashMenu.List>
          </SlashMenu.Content>
        </SlashMenu.Root>
      ) : null}
    </NotraEditor.Root>
  )
}

export interface MenuRenderResult extends RenderResult {
  /** The editor that `useNotraEditor()` returned on the first render. */
  editor: Editor
  /** The editor that `useNotraEditor()` returned on the latest render. */
  currentEditor: () => Editor
  surface: HTMLElement
  /** Re-renders the composition with other options. */
  update: (options: MenuOptions) => Promise<void>
}

/** Renders a composition, by default the reference composition with an empty document. */
export async function renderMenu(options: MenuOptions = {}): Promise<MenuRenderResult> {
  let editor: Editor | undefined
  const onEditor = (current: Editor) => {
    editor = current
  }
  const result = await render(composition(options, onEditor))
  if (!editor) throw new Error('NotraEditor.Root did not create an editor')
  const surface = result.container.querySelector<HTMLElement>('[contenteditable]')
  if (!surface) throw new Error('NotraEditor.Content did not render an editable surface')
  const first = editor
  return {
    ...result,
    editor: first,
    currentEditor: () => editor ?? first,
    surface,
    update: (next) => result.rerender(composition(next, onEditor)),
  }
}

/** The document `doc(...blocks)`. */
export const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content })

/** A text node. */
export const text = (value: string, marks?: string[]): JSONContent =>
  marks
    ? { type: 'text', text: value, marks: marks.map((type) => ({ type })) }
    : { type: 'text', text: value }

/** A paragraph with the given text. */
export const paragraph = (value?: string): JSONContent =>
  value ? { type: 'paragraph', content: [text(value)] } : { type: 'paragraph' }

/** A heading of the given level with the given text. */
export const heading = (level: number, value?: string): JSONContent =>
  value
    ? { type: 'heading', attrs: { level }, content: [text(value)] }
    : { type: 'heading', attrs: { level } }

/** A list item holding the given blocks. */
export const listItem = (...content: JSONContent[]): JSONContent => ({ type: 'listItem', content })

/** A bullet list of the given items. */
export const bulletList = (...content: JSONContent[]): JSONContent => ({
  type: 'bulletList',
  content,
})

/** An ordered list of the given items. */
export const orderedList = (...content: JSONContent[]): JSONContent => ({
  type: 'orderedList',
  attrs: { start: 1, type: null },
  content,
})

/** A blockquote holding the given blocks. */
export const blockquote = (...content: JSONContent[]): JSONContent => ({
  type: 'blockquote',
  content,
})

/** An empty code block. */
export const codeBlock = (value?: string): JSONContent =>
  value
    ? { type: 'codeBlock', attrs: { language: null }, content: [text(value)] }
    : { type: 'codeBlock', attrs: { language: null } }

/** A horizontal rule. */
export const horizontalRule: JSONContent = { type: 'horizontalRule' }

/** Moves the cursor to `position` and focuses the editable surface. */
export async function placeCursor(editor: Editor, position: number | 'end'): Promise<void> {
  await focusEditor(editor, position === 'end' ? 'end' : { from: position, to: position })
}

/**
 * Types `keys` with the keyboard, as `userEvent.keyboard` describes them. The slash menu renders
 * in response, so this runs inside `act()`.
 */
export async function type(keys: string): Promise<void> {
  await act(async () => {
    await userEvent.keyboard(keys)
  })
}

/**
 * Waits `milliseconds`. Chromium drops an arrow key that follows the previous key too quickly
 * for a person, with or without the slash menu, so tests keep a person's pace before them.
 */
export function pause(milliseconds = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/** Presses Mod+Z. */
export async function undo(): Promise<void> {
  await type('{ControlOrMeta>}z{/ControlOrMeta}')
}

/** Clicks `element` with the pointer. */
export async function click(
  element: Element,
  options?: Parameters<typeof userEvent.click>[1],
): Promise<void> {
  await act(async () => {
    await userEvent.click(element, options)
  })
}

/** Moves the pointer onto `element`. */
export async function hover(element: Element): Promise<void> {
  await act(async () => {
    await userEvent.hover(element)
  })
}

/** Runs `callback` inside `act()`. */
export async function run(callback: () => void): Promise<void> {
  await act(async () => {
    callback()
  })
}

/** The element that `SlashMenu.Content` renders, if the menu is open. */
export function menuElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="slash-menu-content"]')
}

/** Whether the menu is open: its element is in the document and not hidden. */
export function isOpen(): boolean {
  const element = menuElement()
  if (!element) return false
  return element.isConnected && element.getClientRects().length > 0
}

/** The listbox of the menu. */
export function listbox(): HTMLElement {
  const element = document.querySelector<HTMLElement>('[role="listbox"]')
  if (!element) throw new Error('no listbox')
  return element
}

/** The options of the menu, in document order. */
export function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
}

/** The title that an option shows. */
export function titleOf(option: Element): string {
  return option.querySelector('[data-slot="slash-menu-item-title"]')?.textContent ?? ''
}

/** The titles of the displayed items, in display order. */
export function displayedTitles(): string[] {
  return options().map(titleOf)
}

/** The option whose element has `aria-selected="true"`. */
export function highlightedOption(): HTMLElement | null {
  const selected = options().filter((option) => option.getAttribute('aria-selected') === 'true')
  expect(selected.length).toBeLessThanOrEqual(1)
  return selected[0] ?? null
}

/** The title of the highlighted item. */
export function highlightedTitle(): string | null {
  const option = highlightedOption()
  return option ? titleOf(option) : null
}

/** The accessible name that `aria-labelledby` or `aria-label` gives `element`. */
export function accessibleName(element: Element): string | null {
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
  }
  return element.getAttribute('aria-label')
}

/** The sections of the menu: their headings and the titles of their items. */
export function sections(): Array<{ heading: string | null; titles: string[] }> {
  return Array.from(listbox().querySelectorAll('[role="group"]')).map((group) => ({
    heading: accessibleName(group),
    titles: Array.from(group.querySelectorAll('[role="option"]')).map(titleOf),
  }))
}

/** Waits until the menu is open, or closed. */
export async function expectOpen(open: boolean): Promise<void> {
  await expect.poll(isOpen).toBe(open)
}

/** Returns a command item with the given title that records its calls. */
export function commandItem(
  title: string,
  extra: Partial<Omit<SlashMenuItem, 'block' | 'command'>> = {},
  calls: unknown[] = [],
): SlashMenuItem {
  return {
    id: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    ...extra,
    command: (props) => {
      calls.push(props)
    },
  }
}

/** Returns the extensions `NotraKit` plus `extra`. */
export function withKit(...extra: Extensions): Extensions {
  return [NotraKit, ...extra]
}

/** The selection of the editor as `{ from, to }`. */
export function selectionOf(editor: Editor): { from: number; to: number } {
  const { from, to } = editor.state.selection
  return { from, to }
}
