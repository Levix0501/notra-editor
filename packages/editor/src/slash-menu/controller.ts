import type { Editor, JSONContent, Range } from '@tiptap/core'
import { closeHistory } from '@tiptap/pm/history'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { type EditorState, type Plugin, PluginKey } from '@tiptap/pm/state'
import type { NotraMessages } from '../messages'
import { createBlockNode, placeBlock, planBlock } from './blocks'
import { type DisplayedItem, type DisplayedSection, rankItems, sectionItems } from './matching'
import {
  createSlashMenuPlugin,
  type SlashMenuMeta,
  type SlashMenuPluginHost,
  type SlashMenuState,
} from './plugin'
import type { SlashMenuItem } from './types'

/** What the slash menu primitives render. */
export interface SlashMenuSnapshot {
  /** Whether the menu is open. */
  open: boolean
  /** The query range while the menu is open. */
  range: Range | null
  /** The displayed items, in sections. */
  sections: DisplayedSection[]
  /** The displayed items, in display order. */
  displayed: DisplayedItem[]
  /** The position of the highlighted item in display order, or -1 when none is. */
  highlighted: number
  /** The active built-in strings. */
  messages: NotraMessages
}

interface Displayed {
  sections: DisplayedSection[]
  displayed: DisplayedItem[]
}

const nothingDisplayed: Displayed = { sections: [], displayed: [] }

/** Numbers the controllers, so that the ids of their elements are unique on the page. */
let instances = 0

function isCommandItem(item: SlashMenuItem): boolean {
  return typeof item.command === 'function'
}

/**
 * Connects a `SlashMenu.Root` to its editor: owns the ProseMirror plugin, decides which items the
 * menu displays, performs the selection of an item, and lets React components subscribe to what
 * they render.
 */
export class SlashMenuController implements SlashMenuPluginHost {
  readonly editor: Editor
  readonly key: PluginKey<SlashMenuState>
  readonly listboxId: string
  /** The element that `SlashMenu.Content` renders, while it is mounted. */
  menuElement: HTMLElement | null = null

  private readonly idPrefix: string
  private readonly plugin: Plugin<SlashMenuState>
  private readonly blockNodes = new WeakMap<JSONContent, ProseMirrorNode | null>()
  private readonly listeners = new Set<() => void>()
  private items: readonly SlashMenuItem[]
  private messages: NotraMessages
  private headingLevels: readonly number[] | null | undefined
  private cache: {
    doc: ProseMirrorNode
    from: number
    to: number
    query: string
    items: readonly SlashMenuItem[]
    messages: NotraMessages
    result: Displayed
  } | null = null
  private snapshot: SlashMenuSnapshot
  /** The document whose pointer presses close the open menu, while they are listened to. */
  private pointerDocument: Document | null = null

  constructor(
    editor: Editor,
    options: { items: readonly SlashMenuItem[]; messages: NotraMessages },
  ) {
    this.editor = editor
    this.items = options.items
    this.messages = options.messages
    instances += 1
    this.idPrefix = `notra-slash-menu-${instances}`
    this.listboxId = `${this.idPrefix}-listbox`
    this.key = new PluginKey<SlashMenuState>('notraSlashMenu')
    this.plugin = createSlashMenuPlugin(this)
    this.snapshot = this.createSnapshot()
  }

  /** Subscribes to changes of the snapshot. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Returns what the slash menu primitives currently render. */
  getSnapshot = (): SlashMenuSnapshot => this.snapshot

  /** Adds the plugin to the editor, before every other plugin, and returns its removal. */
  attach(): () => void {
    const { editor, plugin } = this
    if (editor.isDestroyed) return () => {}
    editor.registerPlugin(plugin, (added, plugins) => [added, ...plugins])
    return () => {
      this.removeOutsidePointerListener()
      if (editor.isDestroyed) return
      const { state } = editor.view
      if (!state.plugins.includes(plugin)) return
      editor.view.updateState(
        state.reconfigure({ plugins: state.plugins.filter((current) => current !== plugin) }),
      )
    }
  }

  /** Updates the item list and the active built-in strings. */
  update(items: readonly SlashMenuItem[], messages: NotraMessages): void {
    if (items === this.items && messages === this.messages) return
    this.items = items
    this.messages = messages
    this.sync()
    // The editable surface names the highlighted option, and the view computes its attributes
    // only when it updates, so update it while the menu is open.
    if (this.isOpen()) this.editor.view.updateState(this.editor.view.state)
  }

  /** Recomputes the snapshot from the editor state and notifies subscribers of a change. */
  sync(): void {
    // Most transactions happen while the menu is closed and leave it closed.
    if (!this.snapshot.open && this.snapshot.messages === this.messages && !this.isOpen()) return
    const next = this.createSnapshot()
    const previous = this.snapshot
    if (
      next.open === previous.open &&
      next.range?.from === previous.range?.from &&
      next.range?.to === previous.range?.to &&
      next.sections === previous.sections &&
      next.highlighted === previous.highlighted &&
      next.messages === previous.messages
    ) {
      return
    }
    this.snapshot = next
    if (next.open) this.addOutsidePointerListener()
    else this.removeOutsidePointerListener()
    for (const listener of [...this.listeners]) listener()
  }

  /** The id of the option that displays the item at `index` in display order. */
  optionId(index: number): string {
    return `${this.idPrefix}-option-${index}`
  }

  /** How many items the menu displays in `state`. */
  displayedCount(state: EditorState): number {
    return this.display(state).displayed.length
  }

  /** Makes the displayed item at `index` the highlighted item. */
  highlight(index: number): void {
    const { view } = this.editor
    const menu = this.key.getState(view.state)
    if (!menu?.open || menu.highlight === index) return
    view.dispatch(
      view.state.tr.setMeta(this.key, { type: 'highlight', index } satisfies SlashMenuMeta),
    )
  }

  /** Closes the menu without changing the document. */
  close(): void {
    if (this.editor.isDestroyed) return
    const { view } = this.editor
    if (!this.key.getState(view.state)?.open) return
    view.dispatch(view.state.tr.setMeta(this.key, { type: 'close' } satisfies SlashMenuMeta))
  }

  /** Selects the displayed item at `index`. */
  select(index: number): void {
    const { editor } = this
    const { view } = editor
    const { state } = view
    const menu = this.key.getState(state)
    const entry = this.display(state).displayed[index]
    if (!menu?.open || !entry) return
    const range: Range = { from: menu.from, to: menu.to }
    const close: SlashMenuMeta = { type: 'close' }
    const { item } = entry

    if (isCommandItem(item)) {
      view.dispatch(state.tr.setMeta(this.key, close))
      item.command?.({ editor, range })
      return
    }

    const node = item.block ? this.blockNode(item.block) : null
    const placement = node ? planBlock(state, range, node) : null
    if (!placement) {
      view.dispatch(state.tr.setMeta(this.key, close))
      return
    }
    // The selection is its own undo step, apart from the typing of the query before it.
    const tr = closeHistory(placeBlock(state.tr, placement, range)).setMeta(this.key, close)
    view.dispatch(tr)
    view.focus()
  }

  private blockNode(block: JSONContent): ProseMirrorNode | null {
    let node = this.blockNodes.get(block)
    if (node === undefined) {
      node = createBlockNode(this.editor.schema, block)
      this.blockNodes.set(block, node)
    }
    return node
  }

  /** The heading levels configured for the editor's `heading` extension, if it has any. */
  private configuredHeadingLevels(): readonly number[] | null {
    if (this.headingLevels === undefined) {
      const heading = this.editor.extensionManager.extensions.find(
        (extension) => extension.name === 'heading',
      )
      const levels: unknown = heading?.options?.levels
      this.headingLevels = Array.isArray(levels) ? levels : null
    }
    return this.headingLevels
  }

  /** Whether `item` can be selected for the query in `range`. */
  private isAvailable(item: SlashMenuItem, state: EditorState, range: Range): boolean {
    if (isCommandItem(item)) return true
    if (typeof item.block !== 'object' || item.block === null) return false
    const node = this.blockNode(item.block)
    if (!node) return false
    const levels = this.configuredHeadingLevels()
    if (node.type.name === 'heading' && levels && !levels.includes(node.attrs.level)) return false
    return planBlock(state, range, node) !== null
  }

  /** The items that the menu displays in `state`. */
  private display(state: EditorState): Displayed {
    const menu = this.key.getState(state)
    if (!menu?.open) return nothingDisplayed
    const { items, messages, cache } = this
    if (
      cache &&
      cache.doc === state.doc &&
      cache.from === menu.from &&
      cache.to === menu.to &&
      cache.query === menu.query &&
      cache.items === items &&
      cache.messages === messages
    ) {
      return cache.result
    }
    const range: Range = { from: menu.from, to: menu.to }
    const available = items.filter((item) => this.isAvailable(item, state, range))
    const sections = sectionItems(rankItems(available, menu.query, messages), messages)
    const result: Displayed = {
      sections,
      displayed: sections.flatMap((section) => section.items),
    }
    this.cache = {
      doc: state.doc,
      from: menu.from,
      to: menu.to,
      query: menu.query,
      items,
      messages,
      result,
    }
    return result
  }

  /** Whether the plugin state of the editor has the menu open. */
  private isOpen(): boolean {
    return !this.editor.isDestroyed && this.key.getState(this.editor.view.state)?.open === true
  }

  private createSnapshot(): SlashMenuSnapshot {
    const { editor, messages } = this
    const state = editor.isDestroyed ? null : editor.view.state
    const menu = state ? this.key.getState(state) : undefined
    if (!state || !menu?.open) {
      return { open: false, range: null, ...nothingDisplayed, highlighted: -1, messages }
    }
    const { sections, displayed } = this.display(state)
    return {
      open: true,
      range: { from: menu.from, to: menu.to },
      sections,
      displayed,
      highlighted: displayed.length === 0 ? -1 : Math.min(menu.highlight, displayed.length - 1),
      messages,
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null
    if (!target || typeof target.nodeType !== 'number') return
    if (this.menuElement?.contains(target)) return
    if (!this.editor.isDestroyed && this.editor.view.dom.contains(target)) return
    this.close()
  }

  private addOutsidePointerListener(): void {
    if (this.pointerDocument || this.editor.isDestroyed) return
    this.pointerDocument = this.editor.view.dom.ownerDocument
    this.pointerDocument.addEventListener('pointerdown', this.onPointerDown, true)
  }

  private removeOutsidePointerListener(): void {
    this.pointerDocument?.removeEventListener('pointerdown', this.onPointerDown, true)
    this.pointerDocument = null
  }
}
