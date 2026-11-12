import { commands as coreCommands, type Editor, Extension } from "@tiptap/core"
import type { MarkdownManager } from "@tiptap/markdown"
import { isHistoryTransaction } from "@tiptap/pm/history"
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

/** How many sources of content set before are kept, see {@link MarkdownSourceState}. */
const KEPT_SOURCES = 10

interface MarkdownSourceState {
  /** The source the document is written with. */
  snapshot: SourceSnapshot | null
  /**
   * The sources of the content set last, the latest first. Undo and redo can
   * bring back content that an earlier `setContent` or `updateContent`
   * replaced, which is then written with the source it was read from.
   */
  sources: SourceSnapshot[]
}

const sourceKey = new PluginKey<MarkdownSourceState>("notraMarkdownSource")

const EMPTY_STATE: MarkdownSourceState = { snapshot: null, sources: [] }

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

/** Runs `write` with the link definitions of `doc`: text in brackets reads as a link when the document defines it. */
function withDefinitions<T>(
  context: NotraMarkdownContext,
  manager: MarkdownManager | undefined,
  doc: ProseMirrorNode,
  write: () => T,
): T {
  const { definitions, references } = context
  context.definitions = getDefinitions(doc)
  context.references = manager
    ? indexReferences(() => new manager.instance.Lexer(manager.instance.defaults), context.definitions)
    : null
  try {
    return write()
  } finally {
    context.definitions = definitions
    context.references = references
  }
}

/**
 * Finds the source that `doc` is written with the most of, the current one
 * when others do not have more (see `SourceWriter.countUnchanged`). Blocks
 * that undo brings back are the nodes of before, which are counted first;
 * blocks with text that changed and changed back are new nodes, which are
 * found by their Markdown, for the sources that have as many nodes.
 */
function findSource(
  manager: MarkdownManager,
  context: NotraMarkdownContext,
  { snapshot, sources }: MarkdownSourceState,
  doc: ProseMirrorNode,
): SourceSnapshot | null {
  if (!snapshot || sources.length < 2) {
    return snapshot
  }
  const candidates = [snapshot, ...sources.filter((source) => source !== snapshot)]
  const keys = new WeakMap<ProseMirrorNode, string>()
  const writers = candidates.map((source) => new SourceWriter(manager, context, source, keys))
  // The indexes of the candidates with the highest count, in their order.
  const most = (indexes: number[], count: (writer: SourceWriter) => number) => {
    const counts = indexes.map((index) => count(writers[index] as SourceWriter))
    return indexes.filter((_, position) => counts[position] === Math.max(...counts))
  }
  let found = most(
    candidates.map((_, index) => index),
    (writer) => writer.countUnchanged(doc, true),
  )
  if (found.length > 1) {
    const tied = found
    found = withDefinitions(context, manager, doc, () => most(tied, (writer) => writer.countUnchanged(doc)))
  }
  return candidates[found[0] ?? 0] as SourceSnapshot
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
 * After undo and redo, it is the one of the last sources that has the most
 * blocks of the document, so that undoing a change from outside writes the
 * document as it was.
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
      const snapshot = sourceKey.getState(editor.state)?.snapshot
      const manager = editor.markdown
      if (!context) {
        return getMarkdown.call(editor)
      }
      const { doc } = editor.state
      return withDefinitions(context, manager, doc, () =>
        snapshot && manager ? new SourceWriter(manager, context, snapshot).write(doc) : getMarkdown.call(editor),
      )
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

    // The new source comes first; without one (other content), the source is not preserved.
    const replace = (value: MarkdownSourceState, created: SourceSnapshot | null): MarkdownSourceState =>
      created ? { snapshot: created, sources: [created, ...value.sources].slice(0, KEPT_SOURCES) } : EMPTY_STATE

    return [
      new Plugin<MarkdownSourceState>({
        key: sourceKey,
        state: {
          init: (_config, state) => {
            const source = context?.initialSource ?? null
            if (context) context.initialSource = null
            return replace(EMPTY_STATE, snapshot(source, state.doc))
          },
          apply: (tr, value, _oldState, newState) => {
            const source: unknown = tr.getMeta(SOURCE_META)
            if (source !== undefined) {
              return replace(value, snapshot(typeof source === "string" ? source : null, newState.doc))
            }
            const update = tr.getMeta(UPDATE_CONTENT_META) as UpdateContentMeta | undefined
            if (update) {
              const isMarkdown = update.contentType === "markdown" && typeof update.content === "string"
              return replace(value, snapshot(isMarkdown ? (update.content as string) : null, newState.doc))
            }
            if (tr.docChanged && isHistoryTransaction(tr) && context && editor.markdown) {
              const found = findSource(editor.markdown, context, value, newState.doc)
              if (found && found !== value.snapshot) {
                detectStyle(context, found.raw)
                return { ...value, snapshot: found }
              }
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
  return sourceKey.getState(editor.state)?.snapshot != null
}
