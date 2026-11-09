import { type Editor, Extension } from "@tiptap/core"

import { createDictionary, type NotraDictionary } from "#i18n/dictionary.ts"
import type { SlashCommandItem } from "./slash-command/items"

/** Uploads a file and resolves with the URL it can be displayed from. */
export type UploadImageHandler = (file: File) => Promise<string>

/** Customizes the items shown in the slash command menu. */
export type SlashCommandsResolver = (defaultItems: SlashCommandItem[]) => SlashCommandItem[]

export interface NotraCoreOptions {
  dictionary: NotraDictionary
  placeholder?: string
  uploadImage?: UploadImageHandler
  slashCommands?: SlashCommandsResolver
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
}

declare module "@tiptap/core" {
  interface Storage {
    notra: NotraStorage
  }
}

/** Transaction meta key used to notify the UI that the storage changed. */
export const NOTRA_STORAGE_UPDATED = "notraStorageUpdated"

export const NotraCore = Extension.create<NotraCoreOptions, NotraStorage>({
  name: "notra",

  addOptions() {
    return {
      dictionary: createDictionary(),
      placeholder: undefined,
      uploadImage: undefined,
      slashCommands: undefined,
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
