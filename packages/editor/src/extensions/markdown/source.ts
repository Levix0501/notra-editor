import { commands as coreCommands, type Editor, Extension } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { UPDATE_CONTENT_META, type UpdateContentMeta } from "../update-content"
import { detectStyle, type NotraMarkdownContext } from "./context"
import { indexReferences } from "./inline"
import { createSnapshot, type SourceSnapshot } from "./source-snapshot"
import { SourceWriter } from "./source-writer"

/**
 * Transaction meta with the Markdown that replaced the content (`null` when
 * the content was replaced with something else).
 */
const SOURCE_META = "notraMarkdownSource"

const sourceKey = new PluginKey<SourceSnapshot | null>("notraMarkdownSource")

/** The link reference definitions of a document, one per line. */
function getDefinitions(doc: ProseMirrorNode): string {
  const definitions: string[] = []
  doc.descendants((node) => {
    if (node.type.name === "rawBlock") {
      if (node.attrs.kind === "definition") definitions.push(node.textContent)
      return false
    }
    return !node.isTextblock
  })
  return definitions.join("\n")
}

export interface MarkdownSourceOptions {
  /** Shared Markdown state, see {@link NotraMarkdownContext}. */
  context: NotraMarkdownContext | null
  /** See `NotraMarkdownOptions.onSourceMismatch`. */
  onSourceMismatch: ((editor: Editor) => void) | null
}

/**
 * Writes Markdown back with the source of unchanged blocks, list items and
 * table rows, so that saving a document only changes what was edited. Line
 * endings, blank lines and the end of the file are kept as well.
 *
 * The source is the Markdown the editor was created with, or the Markdown
 * last passed to `setContent` or `updateContent` (with `contentType: "markdown"`).
 */
export const MarkdownSource = Extension.create<MarkdownSourceOptions>({
  name: "notraMarkdownSource",

  // After the Markdown extension: wraps its `getMarkdown()` and its `setContent` command.
  priority: 90,

  addOptions() {
    return { context: null, onSourceMismatch: null }
  },

  onBeforeCreate() {
    const { editor } = this
    const { context } = this.options
    const getMarkdown = editor.getMarkdown
    editor.getMarkdown = () => {
      const snapshot = sourceKey.getState(editor.state)
      if (!context) {
        return getMarkdown.call(editor)
      }
      // Text in brackets reads as a link when the document defines it, and links can refer to the definitions.
      const { definitions, references } = context
      context.definitions = getDefinitions(editor.state.doc)
      const manager = editor.markdown
      context.references = manager
        ? indexReferences(() => new manager.instance.Lexer(manager.instance.defaults), context.definitions)
        : null
      try {
        return snapshot && manager
          ? new SourceWriter(manager, context, snapshot).write(editor.state.doc)
          : getMarkdown.call(editor)
      } finally {
        context.definitions = definitions
        context.references = references
      }
    }
  },

  addCommands() {
    return {
      setContent: (content, options) => (props) => {
        const { editor, tr, dispatch } = props
        const manager = editor.markdown
        if (options?.contentType !== "markdown" || typeof content !== "string" || !manager) {
          const handled = coreCommands.setContent(content, options)(props)
          if (handled && dispatch) tr.setMeta(SOURCE_META, null)
          return handled
        }
        const handled = coreCommands.setContent(manager.parse(content), options)(props)
        if (handled && dispatch) tr.setMeta(SOURCE_META, content)
        return handled
      },
    }
  },

  addProseMirrorPlugins() {
    const { editor } = this
    const { context, onSourceMismatch } = this.options
    const snapshot = (source: string | null, doc: ProseMirrorNode) => {
      if (source === null || !context || !editor.markdown) {
        return null
      }
      detectStyle(context, source)
      const result = createSnapshot(editor.markdown, context, source, doc)
      if (!result && onSourceMismatch) {
        // Not while the state is updated: the callback may use the editor.
        queueMicrotask(() => {
          if (!editor.isDestroyed) onSourceMismatch(editor)
        })
      }
      return result
    }

    return [
      new Plugin<SourceSnapshot | null>({
        key: sourceKey,
        state: {
          init: (_config, state) => {
            const source = context?.initialSource ?? null
            if (context) context.initialSource = null
            return snapshot(source, state.doc)
          },
          apply: (tr, value, _oldState, newState) => {
            const source: unknown = tr.getMeta(SOURCE_META)
            if (source !== undefined) {
              return snapshot(typeof source === "string" ? source : null, newState.doc)
            }
            const update = tr.getMeta(UPDATE_CONTENT_META) as UpdateContentMeta | undefined
            if (update) {
              const isMarkdown = update.contentType === "markdown" && typeof update.content === "string"
              return snapshot(isMarkdown ? (update.content as string) : null, newState.doc)
            }
            return value
          },
        },
      }),
    ]
  },
})

/** Returns whether the editor writes unchanged Markdown blocks back verbatim. */
export function isPreservingMarkdownSource(editor: Editor): boolean {
  return sourceKey.getState(editor.state) != null
}
