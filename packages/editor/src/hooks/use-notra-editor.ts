import type { AnyExtension, Content, Editor, FocusPosition } from "@tiptap/core"
import { useEditor } from "@tiptap/react"
import { type DependencyList, useEffect, useLayoutEffect, useMemo, useRef } from "react"

import type { NotraFeatures } from "#extensions/features.ts"
import type { ResolveImageUrl } from "#extensions/image.ts"
import { createNotraExtensions } from "#extensions/kit.ts"
import type { LinkClickHandler } from "#extensions/link-click.ts"
import type { NotraMarkdownOptions } from "#extensions/markdown/index.ts"
import {
  getNotraStorage,
  type RawBlockRenderer,
  type SlashCommandsResolver,
  type UploadImageHandler,
  updateNotraStorage,
} from "#extensions/notra-core.ts"
import { createDictionary, type PartialNotraDictionary } from "#i18n/dictionary.ts"

export interface UseNotraEditorOptions {
  /**
   * The initial content: a Tiptap JSON document, or an HTML / Markdown string
   * (see `contentType`). Only read when the editor is created.
   */
  content?: Content
  /**
   * How to parse `content` when it is a string.
   * @default "html"
   */
  contentType?: "json" | "html" | "markdown"
  /**
   * Whether the content can be edited.
   * @default true
   */
  editable?: boolean
  /**
   * Focus the editor on creation, and where to place the cursor.
   * @default false
   */
  autofocus?: FocusPosition
  /** Placeholder shown in empty paragraphs. Overrides the dictionary default. */
  placeholder?: string
  /** UI strings. Pass a complete locale (e.g. `zhCN`) or override single entries. */
  dictionary?: PartialNotraDictionary
  /**
   * Editing features to enable, disable or configure; all are enabled by
   * default. The menus only offer enabled features. Only read when the editor
   * is created. Use `markdownFeatures` for documents stored as Markdown.
   */
  features?: NotraFeatures
  /**
   * Markdown options, for example `{ preserveSource: true }` to write
   * unchanged blocks back verbatim. Only read when the editor is created.
   */
  markdown?: NotraMarkdownOptions
  /** Additional Tiptap extensions. Only read when the editor is created. */
  extensions?: AnyExtension[]
  /**
   * Uploads pasted, dropped or picked image files and resolves with the `src`
   * to store. Images are embedded as data URLs when no handler is provided.
   */
  uploadImage?: UploadImageHandler
  /**
   * Turns the stored `src` of images into a URL that can be displayed, for
   * example a signed URL or a URL for a path relative to the edited file.
   * The document keeps the stored `src`.
   */
  resolveImageUrl?: ResolveImageUrl
  /**
   * Opens links: clicks on links of read-only content and the "open link"
   * buttons. Return `true` when the link was handled; otherwise the browser
   * opens it.
   */
  onLinkClick?: LinkClickHandler
  /**
   * Displays source blocks (front matter, HTML…) differently, for example
   * front matter as a property list. Return `null` to show the source. Read
   * when a block is rendered.
   */
  renderRawBlock?: RawBlockRenderer
  /** Customizes the items of the `/` command menu. */
  slashCommands?: SlashCommandsResolver
  /**
   * Render the editor during the first render. Disable it for server-side
   * rendering. By default Tiptap detects SSR and Next.js automatically.
   */
  immediatelyRender?: boolean
  /** Called once the editor is ready. */
  onCreate?: (editor: Editor) => void
  /** Called on every content change. */
  onUpdate?: (editor: Editor) => void
}

const EDITOR_PROPS = {
  attributes: { class: "notra-content" },
}

/**
 * Creates a notra editor instance. Render it with `<NotraEditorView />`.
 *
 * @param deps Re-creates the editor when one of the dependencies changes.
 *
 * @example
 * const editor = useNotraEditor({ content: "# Hello", contentType: "markdown" })
 * return <NotraEditorView editor={editor} />
 */
export function useNotraEditor(options: UseNotraEditorOptions = {}, deps: DependencyList = []): Editor | null {
  const {
    content,
    contentType,
    editable = true,
    autofocus = false,
    placeholder,
    features,
    markdown,
    extensions,
    uploadImage,
    resolveImageUrl,
    onLinkClick,
    renderRawBlock,
    slashCommands,
    immediatelyRender,
    onCreate,
    onUpdate,
  } = options

  // Dictionaries are plain JSON, so a serialized key keeps the merged result
  // stable even when callers pass a new object on every render.
  const dictionaryKey = JSON.stringify(options.dictionary ?? null)
  const dictionary = useMemo(
    () => createDictionary((JSON.parse(dictionaryKey) as PartialNotraDictionary | null) ?? undefined),
    [dictionaryKey],
  )

  const callbacks = useRef({ onCreate, onUpdate })
  useLayoutEffect(() => {
    callbacks.current = { onCreate, onUpdate }
  })

  // Creation-time options are frozen until `deps` change, so that inline
  // values do not cause unnecessary editor updates.
  const creationOptions = useMemo(
    () => ({
      content,
      contentType,
      autofocus,
      extensions: [
        ...createNotraExtensions({
          dictionary,
          placeholder,
          uploadImage,
          slashCommands,
          resolveImageUrl,
          onLinkClick,
          renderRawBlock,
          features,
          markdown,
        }),
        ...(extensions ?? []),
      ],
    }),
    // biome-ignore lint/correctness/useExhaustiveDependencies: these values are only read when the editor is (re)created
    deps,
  )

  const editor = useEditor(
    {
      ...creationOptions,
      editable,
      immediatelyRender,
      shouldRerenderOnTransaction: false,
      editorProps: EDITOR_PROPS,
      onCreate: ({ editor: instance }) => callbacks.current.onCreate?.(instance),
      onUpdate: ({ editor: instance }) => callbacks.current.onUpdate?.(instance),
    },
    deps,
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed || editor.isEditable === editable) {
      return
    }
    editor.setEditable(editable, false)
    // Notify subscribed UI (menus, block handle) about the change.
    editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false))
  }, [editor, editable])

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    const storage = getNotraStorage(editor)
    // Callbacks are not rendered, so they do not need a refresh transaction.
    storage.uploadImage = uploadImage
    storage.slashCommands = slashCommands
    storage.resolveImageUrl = resolveImageUrl
    storage.onLinkClick = onLinkClick
    storage.renderRawBlock = renderRawBlock
    if (storage.dictionary !== dictionary || storage.placeholder !== placeholder) {
      updateNotraStorage(editor, { dictionary, placeholder })
    }
  }, [editor, dictionary, placeholder, uploadImage, slashCommands, resolveImageUrl, onLinkClick, renderRawBlock])

  return editor
}
