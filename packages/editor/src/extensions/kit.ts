import type { AnyExtension, Editor } from "@tiptap/core"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { FileHandler } from "@tiptap/extension-file-handler"
import { Highlight } from "@tiptap/extension-highlight"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TableKit } from "@tiptap/extension-table"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { Typography } from "@tiptap/extension-typography"
import { Placeholder, Selection } from "@tiptap/extensions"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { StarterKit } from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

import { NotraRawBlock } from "#components/raw-block-view.tsx"
import { Callout } from "./callout"
import { NotraDetails, NotraDetailsContent, NotraDetailsSummary } from "./details"
import {
  getFeatureOptions,
  isFeatureEnabled,
  markdownFeatures,
  type NotraFeatureName,
  type NotraFeatures,
} from "./features"
import { NotraHeading } from "./heading"
import { NotraImage } from "./image"
import { IMAGE_MIME_TYPES, insertImageFiles } from "./image-upload"
import { LinkClick } from "./link-click"
import { createNotraMarkdown, type NotraMarkdownOptions } from "./markdown"
import { NotraParagraph } from "./markdown/paragraph"
import { MarkdownPaste } from "./markdown-paste"
import { getNotraStorage, NotraCore, type NotraCoreOptions } from "./notra-core"
import { SlashCommand } from "./slash-command/extension"
import { UpdateContent } from "./update-content"

const lowlight = createLowlight(common)

export interface NotraExtensionsOptions extends NotraCoreOptions {
  /**
   * Editing features to enable, disable or configure. All features are
   * enabled by default, except with `markdown.preserveSource`, which starts
   * from `markdownFeatures`.
   */
  features?: NotraFeatures
  /** Markdown options. */
  markdown?: NotraMarkdownOptions
}

function getPlaceholder(editor: Editor, node: ProseMirrorNode, pos: number): string {
  const { dictionary, placeholder } = getNotraStorage(editor)

  switch (node.type.name) {
    case "heading": {
      const placeholders: Record<string, string> = dictionary.placeholder
      return placeholders[`heading${node.attrs.level}`] ?? ""
    }
    case "detailsSummary":
      return dictionary.placeholder.toggle
    case "paragraph": {
      const parent = editor.state.doc.resolve(pos).parent.type.name
      if (parent === "listItem") return dictionary.placeholder.listItem
      if (parent === "taskItem") return dictionary.placeholder.taskItem
      if (parent === "blockquote") return dictionary.placeholder.blockquote
      if (parent === "tableCell" || parent === "tableHeader") return ""
      return placeholder ?? dictionary.placeholder.default
    }
    default:
      return ""
  }
}

/**
 * Creates the set of Tiptap extensions that powers notra-editor: the
 * StarterKit, Notion-like blocks, Markdown support, image handling and the
 * slash command menu. `features` turns single features off or configures them.
 */
export function createNotraExtensions(options: NotraExtensionsOptions): AnyExtension[] {
  const { markdown, features: featureOptions, ...coreOptions } = options
  // Documents stored as Markdown only offer what Markdown can store, unless enabled explicitly.
  const features = markdown?.preserveSource ? { ...markdownFeatures, ...featureOptions } : featureOptions
  const enabled = (name: NotraFeatureName) => isFeatureEnabled(features, name)
  const unless = (name: NotraFeatureName) => (enabled(name) ? undefined : false)
  const hasLists = enabled("bulletList") || enabled("orderedList") || enabled("taskList")

  const extensions: AnyExtension[] = [
    NotraCore.configure(coreOptions),
    StarterKit.configure({
      // Replaced by the notra versions below.
      paragraph: false,
      heading: false,
      codeBlock: false,
      blockquote: unless("blockquote"),
      bulletList: unless("bulletList"),
      orderedList: unless("orderedList"),
      listItem: enabled("bulletList") || enabled("orderedList") ? undefined : false,
      listKeymap: hasLists ? undefined : false,
      horizontalRule: unless("divider"),
      bold: unless("bold"),
      italic: unless("italic"),
      underline: unless("underline"),
      strike: unless("strike"),
      code: unless("code"),
      dropcursor: { width: 3, color: false, class: "notra-dropcursor" },
      link: enabled("link")
        ? {
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
            defaultProtocol: "https",
            HTMLAttributes: { rel: "noopener noreferrer nofollow" },
          }
        : false,
    }),
    NotraParagraph,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ editor, node, pos }) => getPlaceholder(editor, node, pos),
    }),
    Selection.configure({ className: "notra-selection" }),
    ...createNotraMarkdown(markdown, NotraRawBlock).extensions,
    MarkdownPaste,
    SlashCommand,
    LinkClick,
    UpdateContent,
  ]

  if (enabled("heading")) {
    extensions.push(NotraHeading)
  }
  if (enabled("taskList")) {
    extensions.push(TaskList, TaskItem.configure({ nested: true }))
  }
  if (enabled("toggle")) {
    extensions.push(NotraDetails.configure({ persist: true }), NotraDetailsSummary, NotraDetailsContent)
  }
  if (enabled("callout")) {
    extensions.push(Callout)
  }
  if (enabled("codeBlock")) {
    extensions.push(
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null, enableTabIndentation: true, tabSize: 2 }),
    )
  }
  if (enabled("table")) {
    extensions.push(
      TableKit.configure({ table: { resizable: getFeatureOptions(features, "table").resizable !== false } }),
    )
  }
  if (enabled("image")) {
    const resize = getFeatureOptions(features, "image").resize !== false
    extensions.push(
      NotraImage.configure({
        allowBase64: true,
        resize: resize ? { enabled: true, minWidth: 64, alwaysPreserveAspectRatio: true } : false,
      }),
      FileHandler.configure({
        allowedMimeTypes: [...IMAGE_MIME_TYPES],
        onPaste: (editor, files) => {
          void insertImageFiles(editor, files)
        },
        onDrop: (editor, files, pos) => {
          void insertImageFiles(editor, files, pos)
        },
      }),
    )
  }
  if (enabled("textColor")) {
    extensions.push(TextStyle, Color)
  }
  if (enabled("highlight")) {
    extensions.push(Highlight.configure({ multicolor: true }))
  }
  if (enabled("typography")) {
    extensions.push(Typography.configure(getFeatureOptions(features, "typography")))
  }

  return extensions
}
