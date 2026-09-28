import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model'
import { type EditorState, Plugin, type PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { getEditorMessages } from '../messages'
import { emptyLineHintClassName } from './styles'

/** The state of the slash menu, kept in the editor state. */
export type SlashMenuState =
  | { open: false }
  | {
      open: true
      /** The position directly before the trigger slash. */
      from: number
      /** The position directly after the query. */
      to: number
      /** The text after the trigger slash. */
      query: string
      /** The position of the highlighted item among the displayed items. */
      highlight: number
    }

/** Metadata that transactions carry to change the slash menu state. */
export type SlashMenuMeta =
  | { type: 'open'; from: number }
  | { type: 'close' }
  | { type: 'highlight'; index: number }

/** What the slash menu plugin needs from the controller that owns it. */
export interface SlashMenuPluginHost {
  readonly editor: Editor
  readonly key: PluginKey<SlashMenuState>
  /** The id of the listbox that `SlashMenu.List` renders. */
  readonly listboxId: string
  /** The id of the option that displays the item at `index` in display order. */
  optionId(index: number): string
  /** How many items the menu displays in `state`. */
  displayedCount(state: EditorState): number
  /** Selects the displayed item at `index`. */
  select(index: number): void
  /** Called after every update of the editor view, and when the plugin view is destroyed. */
  sync(): void
}

const closed: SlashMenuState = { open: false }

const whitespace = /\p{White_Space}/u
const leadingWhitespace = /^\p{White_Space}/u

/** The keys that the menu handles while it displays items. */
const menuKeys = new Set(['ArrowDown', 'ArrowUp', 'Enter', 'Tab'])

/** Whether `node` is a block in which typing `/` can open the menu. */
function isQueryBlock(node: ProseMirrorNode): boolean {
  return node.type.name === 'paragraph' || node.type.name === 'heading'
}

/** Returns the character directly before `$pos` within its textblock, or `''` at its start. */
function characterBefore($pos: ResolvedPos): string {
  const node = $pos.nodeBefore
  if (!node) return ''
  if (node.isText) return node.text?.slice(-1) ?? ''
  if (node.type.spec.linebreakReplacement) return '\n'
  return node.type.spec.leafText?.(node).slice(-1) ?? '\uFFFC'
}

/**
 * Whether a `/` at `pos` of `doc` opens the menu: it must be the first character of a paragraph
 * or heading, or follow whitespace, and must not be marked as code.
 */
export function opensMenu(doc: ProseMirrorNode, pos: number): boolean {
  if (pos < 0 || pos >= doc.content.size) return false
  const $pos = doc.resolve(pos)
  if (!isQueryBlock($pos.parent) || $pos.parent.type.spec.code) return false
  const slash = doc.resolve(pos + 1).nodeBefore
  if (!slash?.isText || !slash.text?.endsWith('/') || doc.resolve(pos + 1).parent !== $pos.parent) {
    return false
  }
  if (slash.marks.some((mark) => mark.type.spec.code)) return false
  return $pos.parentOffset === 0 || whitespace.test(characterBefore($pos))
}

/** Returns the next state of the menu after `tr`. */
function nextState(
  key: PluginKey<SlashMenuState>,
  tr: EditorState['tr'],
  previous: SlashMenuState,
  state: EditorState,
): SlashMenuState {
  const meta = tr.getMeta(key) as SlashMenuMeta | undefined
  if (meta?.type === 'close') return closed
  if (meta?.type !== 'open' && !previous.open) return previous

  let from = meta?.type === 'open' ? meta.from : previous.open ? previous.from : -1
  let to = meta?.type === 'open' ? meta.from + 1 : previous.open ? previous.to : -1
  let highlight = meta?.type !== 'open' && previous.open ? previous.highlight : 0
  const query = meta?.type !== 'open' && previous.open ? previous.query : null
  if (meta?.type !== 'open' && tr.docChanged) {
    const start = tr.mapping.mapResult(from, 1)
    // Deleting the trigger slash closes the menu.
    if (start.deletedAfter) return closed
    from = start.pos
    // Text typed or pasted at the end of the query extends it.
    to = tr.mapping.map(to, 1)
  }

  const { doc, selection } = state
  if (from < 0 || to <= from || to > doc.content.size) return closed
  const $from = doc.resolve(from)
  const $to = doc.resolve(to)
  if (!$from.sameParent($to) || !isQueryBlock($from.parent)) return closed
  if (doc.textBetween(from, from + 1) !== '/') return closed
  // The query is text: inserting another inline node, such as a line break, ends it.
  let onlyText = true
  doc.nodesBetween(from, to, (node) => {
    if (node.isInline && !node.isText) onlyText = false
    return onlyText
  })
  if (!onlyText) return closed
  // The menu stays open only while the cursor is after the trigger slash and within the query.
  if (!(selection instanceof TextSelection) || selection.from < from + 1 || selection.to > to) {
    return closed
  }

  const nextQuery = doc.textBetween(from + 1, to, '\n', '\n')
  if (meta?.type === 'highlight') highlight = meta.index
  else if (nextQuery !== query) highlight = 0

  if (
    previous.open &&
    previous.from === from &&
    previous.to === to &&
    previous.query === nextQuery &&
    previous.highlight === highlight
  ) {
    return previous
  }
  return { open: true, from, to, query: nextQuery, highlight }
}

/** Handles text that the user types while the plugin is active. */
function handleTextInput(
  host: SlashMenuPluginHost,
  view: EditorView,
  from: number,
  to: number,
  text: string,
  deflt: () => EditorState['tr'],
): boolean {
  if (view.composing) return false
  const { key, editor } = host
  const menu = key.getState(view.state)

  if (menu?.open && from >= menu.from + 1 && to <= menu.to) {
    // Whitespace becomes part of the query, unless it directly follows the trigger slash or no
    // item is displayed; then the menu closes and keeps the typed text.
    if (
      whitespace.test(text) &&
      ((from === menu.from + 1 && leadingWhitespace.test(text)) ||
        host.displayedCount(view.state) === 0)
    ) {
      view.dispatch(deflt().setMeta(key, { type: 'close' } satisfies SlashMenuMeta))
      return true
    }
    return false
  }

  if (!text.endsWith('/') || !editor.isEditable) return false
  const tr = deflt()
  // The typed text ends directly before the cursor. Typed over a selected node, at a gap cursor
  // or over the whole document, it does not start at `from` but inside a paragraph that the
  // replacement puts there.
  const slash = tr.selection.from - 1
  if (!tr.selection.empty || !opensMenu(tr.doc, slash)) return false
  view.dispatch(tr.setMeta(key, { type: 'open', from: slash } satisfies SlashMenuMeta))
  return true
}

/** Handles a key press while the plugin is active. */
function handleKeyDown(host: SlashMenuPluginHost, view: EditorView, event: KeyboardEvent): boolean {
  const { key } = host
  const menu = key.getState(view.state)
  if (!menu?.open) return false
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false
  const composing = event.isComposing || event.keyCode === 229

  if (event.key === 'Escape') {
    if (composing) return false
    view.dispatch(view.state.tr.setMeta(key, { type: 'close' } satisfies SlashMenuMeta))
    return true
  }

  if (!menuKeys.has(event.key)) return false
  const count = host.displayedCount(view.state)
  if (count === 0) return false
  // A key that belongs to an input method composition leaves the menu as it is, and is kept
  // away from the editor's own shortcuts while the menu displays items.
  if (composing) return true

  const current = Math.min(menu.highlight, count - 1)
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const index = event.key === 'ArrowDown' ? (current + 1) % count : (current - 1 + count) % count
    view.dispatch(view.state.tr.setMeta(key, { type: 'highlight', index } satisfies SlashMenuMeta))
  } else {
    host.select(current)
  }
  return true
}

/**
 * Returns the empty-line hint decoration: the paragraph that holds the cursor shows the hint
 * while it is empty, the editor is editable and focused, and the document is not empty.
 */
function emptyLineHint(host: SlashMenuPluginHost, state: EditorState): DecorationSet | null {
  const { editor } = host
  if (!editor.isEditable || !editor.isFocused) return null
  const { selection, doc } = state
  if (!(selection instanceof TextSelection) || !selection.empty) return null
  const { $from } = selection
  const paragraph = $from.parent
  if (paragraph.type.name !== 'paragraph' || paragraph.content.size > 0) return null
  // An empty document shows the editor's placeholder instead.
  if ($from.depth === 1 && doc.childCount === 1) return null
  const pos = $from.before()
  return DecorationSet.create(doc, [
    Decoration.node(pos, pos + paragraph.nodeSize, {
      class: emptyLineHintClassName,
      'data-empty-line-hint': getEditorMessages(editor).slashMenuHint,
    }),
  ])
}

/**
 * Creates the ProseMirror plugin of a slash menu: it opens the menu when `/` is typed, tracks
 * the query, handles the menu keys, exposes the menu to assistive technology through the
 * editable surface's attributes, and shows the empty-line hint.
 */
export function createSlashMenuPlugin(host: SlashMenuPluginHost): Plugin<SlashMenuState> {
  const { key } = host
  return new Plugin<SlashMenuState>({
    key,
    state: {
      init: () => closed,
      apply: (tr, previous, _oldState, newState) => nextState(key, tr, previous, newState),
    },
    props: {
      handleTextInput: (view, from, to, text, deflt) =>
        handleTextInput(host, view, from, to, text, deflt),
      handleKeyDown: (view, event) => handleKeyDown(host, view, event),
      attributes: (state): Record<string, string> => {
        const menu = key.getState(state)
        if (!menu?.open) return {}
        const attributes: Record<string, string> = { 'aria-controls': host.listboxId }
        const count = host.displayedCount(state)
        if (count > 0) {
          attributes['aria-activedescendant'] = host.optionId(Math.min(menu.highlight, count - 1))
        }
        return attributes
      },
      decorations: (state) => emptyLineHint(host, state),
    },
    view: () => {
      host.sync()
      return {
        update: () => host.sync(),
        destroy: () => host.sync(),
      }
    },
  })
}
