import type { AnyExtension, Editor } from "@tiptap/core"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details"
import { FileHandler } from "@tiptap/extension-file-handler"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TableKit } from "@tiptap/extension-table"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { Typography } from "@tiptap/extension-typography"
import { Placeholder, Selection } from "@tiptap/extensions"
import { Markdown } from "@tiptap/markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { StarterKit } from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

import { IMAGE_MIME_TYPES, insertImageFiles } from "./image-upload"
import { MarkdownPaste } from "./markdown-paste"
import { getNotraStorage, NotraCore, type NotraCoreOptions } from "./notra-core"
import { SlashCommand } from "./slash-command/extension"

const lowlight = createLowlight(common)

function getPlaceholder(editor: Editor, node: ProseMirrorNode, pos: number): string {
  const { dictionary, placeholder } = getNotraStorage(editor)

  switch (node.type.name) {
    case "heading": {
      const level = node.attrs.level as 1 | 2 | 3
      return dictionary.placeholder[`heading${level}`] ?? ""
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
 * slash command menu.
 */
export function createNotraExtensions(options: NotraCoreOptions): AnyExtension[] {
  return [
    NotraCore.configure(options),
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      dropcursor: { width: 3, color: false, class: "notra-dropcursor" },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      },
    }),
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ editor, node, pos }) => getPlaceholder(editor, node, pos),
    }),
    Selection.configure({ className: "notra-selection" }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Typography,
    Image.configure({
      allowBase64: true,
      resize: { enabled: true, minWidth: 64, alwaysPreserveAspectRatio: true },
    }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: null, enableTabIndentation: true, tabSize: 2 }),
    TableKit.configure({ table: { resizable: true } }),
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    Markdown,
    MarkdownPaste,
    FileHandler.configure({
      allowedMimeTypes: [...IMAGE_MIME_TYPES],
      onPaste: (editor, files) => {
        void insertImageFiles(editor, files)
      },
      onDrop: (editor, files, pos) => {
        void insertImageFiles(editor, files, pos)
      },
    }),
    SlashCommand,
  ]
}
