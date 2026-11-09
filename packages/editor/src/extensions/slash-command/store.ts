import type { SlashCommandItem } from "./items"

export interface SlashMenuSnapshot {
  /** Whether the menu is open. */
  open: boolean
  /** Floating element the menu is rendered into, positioned by the suggestion plugin. */
  element: HTMLElement | null
  items: SlashCommandItem[]
  query: string
  selectedIndex: number
}

const CLOSED: SlashMenuSnapshot = {
  open: false,
  element: null,
  items: [],
  query: "",
  selectedIndex: 0,
}

type Command = (item: SlashCommandItem) => void

/**
 * A tiny external store bridging the suggestion plugin (imperative) and the
 * React slash menu (declarative, via `useSyncExternalStore`).
 */
export class SlashMenuStore {
  private snapshot: SlashMenuSnapshot = CLOSED
  private readonly listeners = new Set<() => void>()
  private command: Command | null = null

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): SlashMenuSnapshot => this.snapshot

  open(state: { element: HTMLElement; items: SlashCommandItem[]; query: string; command: Command }): void {
    this.command = state.command
    this.set({ open: true, element: state.element, items: state.items, query: state.query, selectedIndex: 0 })
  }

  update(state: { items: SlashCommandItem[]; query: string; command: Command }): void {
    this.command = state.command
    this.set({ items: state.items, query: state.query, selectedIndex: 0 })
  }

  close(): void {
    this.command = null
    this.set(CLOSED)
  }

  select(index: number): void {
    this.set({ selectedIndex: index })
  }

  execute(item: SlashCommandItem): void {
    this.command?.(item)
  }

  /** Handles keyboard navigation. Returns `true` when the event was consumed. */
  handleKeyDown(event: KeyboardEvent): boolean {
    const { open, items, selectedIndex } = this.snapshot
    if (!open || event.isComposing) {
      return false
    }

    switch (event.key) {
      case "ArrowDown": {
        if (items.length > 0) this.select((selectedIndex + 1) % items.length)
        return true
      }
      case "ArrowUp": {
        if (items.length > 0) this.select((selectedIndex - 1 + items.length) % items.length)
        return true
      }
      case "Enter":
      case "Tab": {
        const item = items[selectedIndex]
        if (!item) return false
        this.execute(item)
        return true
      }
      default:
        return false
    }
  }

  private set(partial: Partial<SlashMenuSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial }
    for (const listener of this.listeners) {
      listener()
    }
  }
}
