import { type Editor, Extension } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { ReactNode } from "react"

import { createDictionary, type NotraDictionary } from "#i18n/dictionary.ts"
import type { ResolveImageUrl } from "./image"
import type { LinkClickHandler } from "./link-click"
import type { SlashCommandItem } from "./slash-command/items"

/**
 * Uploads a file and resolves with the `src` to store in the document. It can
 * be a URL or, together with `resolveImageUrl`, any reference such as a path
 * relative to the edited file.
 */
export type UploadImageHandler = (file: File) => Promise<string>

/** Customizes the items shown in the slash command menu. */
export type SlashCommandsResolver = (defaultItems: SlashCommandItem[]) => SlashCommandItem[]

/**
 * Displays a source block (front matter, HTML…) differently, for example
 * front matter as a property list or sanitized HTML. Return `null` to show the
 * source. The source is shown while the block is being edited.
 */
export type RawBlockRenderer = (source: string, kind: string) => ReactNode

export interface NotraCoreOptions {
  dictionary: NotraDictionary
  placeholder?: string
  uploadImage?: UploadImageHandler
  slashCommands?: SlashCommandsResolver
  resolveImageUrl?: ResolveImageUrl
  onLinkClick?: LinkClickHandler
  renderRawBlock?: RawBlockRenderer
}

/**
 * Runtime state shared between the editor extensions and the React UI. Unlike
 * extension options, storage can be updated after the editor was created.
 */
export interface NotraStorage extends NotraCoreOptions {
  /** Opens the "insert image" panel. Registered by the editor view. */
  openImagePanel?: () => void
  /** Opens the link editor for the current selection. Registered by the bubble menu. */
  openLinkPanel?: () => void
  /** Element that menus are portaled into. Registered by the editor view. */
  portalContainer?: HTMLElement | null
}

declare module "@tiptap/core" {
  interface Storage {
    notra: NotraStorage
  }
}

/** Transaction meta key used to notify the UI that the storage changed. */
export const NOTRA_STORAGE_UPDATED = "notraStorageUpdated"

/** Returns the label of blocks that show one (source blocks and callouts). */
function getBlockLabel(node: ProseMirrorNode, dictionary: NotraDictionary): string | null {
  switch (node.type.name) {
    case "rawBlock": {
      const labels: Record<string, string> = dictionary.rawBlock
      const kind = String(node.attrs.kind ?? "")
      // Kinds of Markdown dialects are shown with their name.
      return labels[kind] ?? (kind || dictionary.rawBlock.source)
    }
    case "callout": {
      const labels: Record<string, string> = dictionary.callout
      return labels[node.attrs.type as string] ?? null
    }
    default:
      return null
  }
}

function createLabels(doc: ProseMirrorNode, dictionary: NotraDictionary): DecorationSet {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    const label = getBlockLabel(node, dictionary)
    if (label) {
      decorations.push(Decoration.node(pos, pos + node.nodeSize, { "data-label": label }))
    }
    // Labeled blocks never live inside of text blocks.
    return !node.isTextblock
  })
  return DecorationSet.create(doc, decorations)
}

const labelsKey = new PluginKey<DecorationSet>("notraLabels")

export const NotraCore = Extension.create<NotraCoreOptions, NotraStorage>({
  name: "notra",

  addOptions() {
    return {
      dictionary: createDictionary(),
      placeholder: undefined,
      uploadImage: undefined,
      slashCommands: undefined,
      resolveImageUrl: undefined,
      onLinkClick: undefined,
      renderRawBlock: undefined,
    }
  },

  addStorage() {
    return { ...this.options }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        if (this.editor.state.selection.empty || !this.storage.openLinkPanel) {
          return false
        }
        this.storage.openLinkPanel()
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    const { storage } = this

    return [
      // Localized labels of source blocks and callouts, rendered with CSS (`attr(data-label)`).
      new Plugin({
        key: labelsKey,
        state: {
          init: (_config, state) => createLabels(state.doc, storage.dictionary),
          apply: (tr, labels, _oldState, newState) =>
            tr.docChanged || tr.getMeta(NOTRA_STORAGE_UPDATED)
              ? createLabels(newState.doc, storage.dictionary)
              : labels,
        },
        props: {
          decorations: (state) => labelsKey.getState(state),
        },
      }),
    ]
  },
})

/** Returns the notra storage of an editor. */
export function getNotraStorage(editor: Editor): NotraStorage {
  return editor.storage.notra
}

/**
 * Updates the notra storage and dispatches an empty transaction so that
 * decorations (placeholders) and subscribed UI pick up the change.
 */
export function updateNotraStorage(editor: Editor, values: Partial<NotraCoreOptions>): void {
  if (editor.isDestroyed) {
    return
  }
  Object.assign(editor.storage.notra, values)
  editor.view.dispatch(editor.state.tr.setMeta(NOTRA_STORAGE_UPDATED, true).setMeta("addToHistory", false))
}
