import type { Editor } from "@tiptap/core";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  type LucideIcon,
  Pilcrow,
  TextQuote,
} from "lucide-react";

import type { MessageKey } from "../i18n/messages";

export type BlockType = {
  id: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

// Defined as a named const so `activeBlockType` can fall back to it without an
// unchecked array index.
const paragraphBlock: BlockType = {
  id: "paragraph",
  labelKey: "bubble.paragraph.label",
  icon: Pilcrow,
  isActive: (e) => e.isActive("paragraph"),
  run: (e) => e.chain().focus().setParagraph().run(),
};

// Display order — top to bottom in the dropdown. Mirrors the slash menu's block
// set; commands are in-place (no deleteRange) so they apply to the current
// selection's block.
export const blockTypes: BlockType[] = [
  paragraphBlock,
  {
    id: "heading-1",
    labelKey: "bubble.heading-1.label",
    icon: Heading1,
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading-2",
    labelKey: "bubble.heading-2.label",
    icon: Heading2,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    labelKey: "bubble.heading-3.label",
    icon: Heading3,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    labelKey: "bubble.bullet-list.label",
    icon: List,
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    labelKey: "bubble.ordered-list.label",
    icon: ListOrdered,
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    labelKey: "bubble.blockquote.label",
    icon: TextQuote,
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code-block",
    labelKey: "bubble.code-block.label",
    icon: Code2,
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];

// Which block type the trigger should display and which list row gets the check.
// Check specific types before paragraph: a paragraph nested in a list item
// reports isActive("paragraph") === true, but the user means "Bullet List".
export function activeBlockType(editor: Editor): BlockType {
  return blockTypes.find((b) => b.id !== "paragraph" && b.isActive(editor)) ?? paragraphBlock;
}

// Apply a block-type conversion from the bubble menu, then collapse the
// selection to a caret. The bubble menu is selection-driven, so collapsing the
// selection dismisses it after the user picks a type; the editor keeps focus so
// typing can continue.
export function applyBlockType(editor: Editor, block: BlockType): void {
  block.run(editor);
  editor.chain().focus().setTextSelection(editor.state.selection.to).run();
}
