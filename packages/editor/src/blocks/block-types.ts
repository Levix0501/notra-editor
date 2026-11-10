import type { ChainedCommands, Editor } from "@tiptap/core"
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model"
import { TextSelection } from "@tiptap/pm/state"
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  InfoIcon,
  ListCollapseIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  type LucideIcon,
  SquareCodeIcon,
  TextQuoteIcon,
  TypeIcon,
} from "lucide-react"

import type { NotraDictionary } from "#i18n/dictionary.ts"

export type BlockTypeId = keyof Pick<
  NotraDictionary["blocks"],
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "toggle"
  | "blockquote"
  | "callout"
  | "codeBlock"
>

/** A block type that existing text blocks can be converted into. */
export interface BlockType {
  id: BlockTypeId
  icon: LucideIcon
  /** Markdown shortcut that creates this block, shown as a hint. */
  shortcut?: string
  /** Node types the block needs. The block is not offered when one of them is missing. */
  nodes: readonly string[]
  /** Whether the block containing the selection is of this type. */
  isActive: (editor: Editor) => boolean
  /** Converts the block(s) in the current selection into this type. */
  convert: (chain: ChainedCommands, editor: Editor) => ChainedCommands
}

/**
 * Converts the text block containing the selection into a toggle, keeping
 * its text as the toggle title (like Notion does).
 */
function convertToToggle(chain: ChainedCommands, editor: Editor): ChainedCommands {
  const { state } = editor
  const { $from, empty } = state.selection
  const textBlock = $from.parent
  const { details, detailsSummary, detailsContent, paragraph } = state.schema.nodes

  if (!details || !detailsSummary || !detailsContent || !paragraph) {
    return chain
  }

  const isSingleTextBlock = textBlock.isTextblock && (empty || state.selection.$to.parent === textBlock)

  if (!isSingleTextBlock || textBlock.content.size === 0) {
    return chain.clearNodes().setDetails()
  }

  return chain.clearNodes().command(({ tr }) => {
    const { $from: from } = tr.selection
    const block = from.parent
    const start = from.before()
    const titleNodes: ProseMirrorNode[] = []

    block.content.forEach((node) => {
      if (node.isText) {
        titleNodes.push(node)
      }
    })

    const toggle = details.create(null, [
      detailsSummary.create(null, Fragment.from(titleNodes)),
      detailsContent.create(null, paragraph.create()),
    ])

    tr.replaceWith(start, start + block.nodeSize, toggle)
    // Place the cursor at the end of the toggle title.
    tr.setSelection(TextSelection.create(tr.doc, start + 2 + toggle.child(0).content.size))
    return true
  })
}

function isPlainParagraph(editor: Editor): boolean {
  return (
    editor.isActive("paragraph") &&
    !editor.isActive("bulletList") &&
    !editor.isActive("orderedList") &&
    !editor.isActive("taskList") &&
    !editor.isActive("blockquote") &&
    !editor.isActive("callout") &&
    !editor.isActive("details")
  )
}

export const blockTypes: readonly BlockType[] = [
  {
    id: "paragraph",
    icon: TypeIcon,
    nodes: ["paragraph"],
    isActive: isPlainParagraph,
    convert: (chain) => chain.clearNodes().setParagraph(),
  },
  {
    id: "heading1",
    icon: Heading1Icon,
    shortcut: "#",
    nodes: ["heading"],
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    convert: (chain) => chain.clearNodes().setHeading({ level: 1 }),
  },
  {
    id: "heading2",
    icon: Heading2Icon,
    shortcut: "##",
    nodes: ["heading"],
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    convert: (chain) => chain.clearNodes().setHeading({ level: 2 }),
  },
  {
    id: "heading3",
    icon: Heading3Icon,
    shortcut: "###",
    nodes: ["heading"],
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    convert: (chain) => chain.clearNodes().setHeading({ level: 3 }),
  },
  {
    id: "bulletList",
    icon: ListIcon,
    shortcut: "-",
    nodes: ["bulletList", "listItem"],
    isActive: (editor) => editor.isActive("bulletList"),
    convert: (chain) => chain.clearNodes().toggleBulletList(),
  },
  {
    id: "orderedList",
    icon: ListOrderedIcon,
    shortcut: "1.",
    nodes: ["orderedList", "listItem"],
    isActive: (editor) => editor.isActive("orderedList"),
    convert: (chain) => chain.clearNodes().toggleOrderedList(),
  },
  {
    id: "taskList",
    icon: ListTodoIcon,
    shortcut: "[]",
    nodes: ["taskList", "taskItem"],
    isActive: (editor) => editor.isActive("taskList"),
    convert: (chain) => chain.clearNodes().toggleTaskList(),
  },
  {
    id: "toggle",
    icon: ListCollapseIcon,
    nodes: ["details", "detailsSummary", "detailsContent"],
    isActive: (editor) => editor.isActive("details"),
    convert: convertToToggle,
  },
  {
    id: "blockquote",
    icon: TextQuoteIcon,
    shortcut: ">",
    nodes: ["blockquote"],
    isActive: (editor) => editor.isActive("blockquote"),
    convert: (chain) => chain.clearNodes().toggleBlockquote(),
  },
  {
    id: "callout",
    icon: InfoIcon,
    nodes: ["callout"],
    isActive: (editor) => editor.isActive("callout"),
    convert: (chain) => chain.clearNodes().toggleCallout(),
  },
  {
    id: "codeBlock",
    icon: SquareCodeIcon,
    shortcut: "```",
    nodes: ["codeBlock"],
    isActive: (editor) => editor.isActive("codeBlock"),
    convert: (chain) => chain.clearNodes().toggleCodeBlock(),
  },
]

/** Order in which block types are matched to find the "current" one. */
const DETECTION_ORDER: readonly BlockTypeId[] = [
  "codeBlock",
  "heading1",
  "heading2",
  "heading3",
  "taskList",
  "orderedList",
  "bulletList",
  "toggle",
  "blockquote",
  "callout",
  "paragraph",
]

/** Whether the editor has the node types a block type needs. */
export function isBlockTypeAvailable(editor: Editor, blockType: BlockType): boolean {
  return blockType.nodes.every((name) => editor.schema.nodes[name] !== undefined)
}

/** Returns the block types the editor can create, in menu order. */
export function getAvailableBlockTypes(editor: Editor): BlockType[] {
  return blockTypes.filter((blockType) => isBlockTypeAvailable(editor, blockType))
}

/** Returns the block type of the block containing the selection. */
export function getActiveBlockType(editor: Editor): BlockType | undefined {
  for (const id of DETECTION_ORDER) {
    const blockType = blockTypes.find((type) => type.id === id)
    if (blockType?.isActive(editor)) {
      return blockType
    }
  }
  return undefined
}

/** Converts the block(s) in the current selection into the given type. */
export function convertBlock(editor: Editor, blockType: BlockType): boolean {
  return blockType.convert(editor.chain().focus(), editor).run()
}
