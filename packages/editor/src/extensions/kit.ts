import type { AnyExtension } from "@tiptap/core"
import { FileHandler } from "@tiptap/extension-file-handler"
import { Highlight } from "@tiptap/extension-highlight"
import { TableKit } from "@tiptap/extension-table"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"
import { StarterKit } from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

import { NotraRawBlock } from "#components/raw-block-view.tsx"
import { Callout } from "./callout"
import { NotraCodeBlock } from "./code-block"
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
import { NotraListItem, NotraOrderedList, NotraTaskItem, NotraTaskList } from "./lists"
import { createNotraMarkdown, type NotraMarkdownOptions } from "./markdown"
import { NotraParagraph } from "./markdown/paragraph"
import { MarkdownPaste } from "./markdown-paste"
import { NotraCore, type NotraCoreOptions } from "./notra-core"
import { NotraPlaceholder } from "./placeholder"
import { SlashCommand } from "./slash-command/extension"
import { TextTableCell, TextTableHeader } from "./table"
import { TrailingParagraph } from "./trailing-paragraph"
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

/**
 * Whether typed text becomes a link: only what Markdown (GFM) reads as a
 * link, URLs with a scheme or starting with `www.` and email addresses. File
 * names such as `README.md` or `app.py` end in a top-level domain, but they
 * are not links.
 */
function shouldAutoLink(url: string): boolean {
  return /^(?:(?:https?|ftp):\/\/|www\.)/i.test(url) || /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(url)
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
  const notraMarkdown = createNotraMarkdown(markdown, NotraRawBlock)

  const extensions: AnyExtension[] = [
    NotraCore.configure(coreOptions),
    StarterKit.configure({
      // Replaced by the notra versions below.
      paragraph: false,
      heading: false,
      codeBlock: false,
      orderedList: false,
      listItem: false,
      blockquote: unless("blockquote"),
      bulletList: unless("bulletList"),
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
            shouldAutoLink,
            defaultProtocol: "https",
            HTMLAttributes: { rel: "noopener noreferrer nofollow" },
          }
        : false,
    }),
    NotraParagraph.configure({ context: notraMarkdown.context }),
    NotraPlaceholder,
    Selection.configure({ className: "notra-selection" }),
    ...notraMarkdown.extensions,
    MarkdownPaste,
    SlashCommand,
    LinkClick,
    UpdateContent,
    TrailingParagraph,
  ]

  if (enabled("heading")) {
    extensions.push(NotraHeading.configure({ context: notraMarkdown.context }))
  }
  if (enabled("bulletList") || enabled("orderedList")) {
    extensions.push(NotraListItem)
  }
  if (enabled("orderedList")) {
    extensions.push(NotraOrderedList)
  }
  if (enabled("taskList")) {
    extensions.push(NotraTaskList, NotraTaskItem.configure({ nested: true }))
  }
  if (enabled("toggle")) {
    extensions.push(NotraDetails.configure({ persist: true }), NotraDetailsSummary, NotraDetailsContent)
  }
  if (enabled("callout")) {
    extensions.push(Callout)
  }
  if (enabled("codeBlock")) {
    extensions.push(
      NotraCodeBlock.configure({ lowlight, defaultLanguage: null, enableTabIndentation: true, tabSize: 2 }),
    )
  }
  if (enabled("table")) {
    const { resizable, blocksInCells } = getFeatureOptions(features, "table")
    const textCells = blocksInCells === false
    extensions.push(
      TableKit.configure({
        table: { resizable: resizable !== false },
        ...(textCells ? { tableCell: false, tableHeader: false } : {}),
      }),
      ...(textCells ? [TextTableCell, TextTableHeader] : []),
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
