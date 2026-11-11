import { Extension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import { Suggestion } from "@tiptap/suggestion"

import { getNotraStorage } from "../notra-core"
import { isInTextCell } from "../table"
import { createDefaultSlashCommands, filterSlashCommands, type SlashCommandItem } from "./items"
import { SlashMenuStore } from "./store"

export const slashCommandPluginKey = new PluginKey("notraSlashCommand")

export interface SlashCommandStorage {
  store: SlashMenuStore
}

declare module "@tiptap/core" {
  interface Storage {
    notraSlashCommand: SlashCommandStorage
  }
}

/**
 * Opens a block menu when `/` is typed at the start of a line or after a
 * space. The menu itself is rendered by the `SlashMenu` React component.
 */
export const SlashCommand = Extension.create<Record<string, never>, SlashCommandStorage>({
  name: "notraSlashCommand",

  addStorage() {
    return { store: new SlashMenuStore() }
  },

  addProseMirrorPlugins() {
    const { store } = this.storage

    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        pluginKey: slashCommandPluginKey,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          // Never trigger inside code blocks or inline code, or in table cells that only hold text.
          if ($from.parent.type.spec.code || isInTextCell(state.selection)) return false
          return !$from.marks().some((mark) => mark.type.spec.code)
        },
        items: ({ query, editor }) => {
          const storage = getNotraStorage(editor)
          const defaults = createDefaultSlashCommands(storage.dictionary, editor)
          const items = storage.slashCommands ? storage.slashCommands(defaults) : defaults
          return filterSlashCommands(items, query)
        },
        command: ({ editor, range, props }) => {
          props.run({ editor, range })
        },
        render: () => {
          let unmount: (() => void) | undefined

          return {
            onStart: (props) => {
              const element = document.createElement("div")
              element.setAttribute("data-notra-slash-menu", "")
              // A connected element is positioned where it is instead of being moved to `document.body`.
              getNotraStorage(props.editor).portalContainer?.appendChild(element)
              // Floating UI positions the element asynchronously. Until then, keep
              // it out of the flow, where it would extend the end of the document.
              Object.assign(element.style, {
                position: "fixed",
                top: "0",
                left: "0",
                zIndex: "var(--notra-z-index, 50)",
              })
              unmount = props.mount(element)
              store.open({ element, items: props.items, query: props.query, command: props.command })
            },
            onUpdate: (props) => {
              store.update({ items: props.items, query: props.query, command: props.command })
            },
            onKeyDown: ({ event }) => store.handleKeyDown(event),
            onExit: () => {
              const { element } = store.getSnapshot()
              store.close()
              unmount?.()
              unmount = undefined
              element?.remove()
            },
          }
        },
      }),
    ]
  },
})
