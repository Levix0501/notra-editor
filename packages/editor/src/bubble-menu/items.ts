import type { Editor } from "@tiptap/core";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Strikethrough,
} from "lucide-react";
import type { ComponentType } from "react";

import { LinkPopover } from "./link-popover";

export type ToggleItem = {
  kind: "toggle";
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

export type CustomItem = {
  kind: "custom";
  id: string;
  component: ComponentType<{ editor: Editor }>;
};

export type BubbleMenuItem = ToggleItem | CustomItem;

export const bubbleMenuItems: BubbleMenuItem[] = [
  {
    kind: "toggle",
    id: "heading-1",
    label: "Heading 1",
    icon: Heading1,
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    kind: "toggle",
    id: "heading-2",
    label: "Heading 2",
    icon: Heading2,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    kind: "toggle",
    id: "heading-3",
    label: "Heading 3",
    icon: Heading3,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    kind: "toggle",
    id: "bold",
    label: "Bold",
    icon: Bold,
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    kind: "toggle",
    id: "italic",
    label: "Italic",
    icon: Italic,
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    kind: "toggle",
    id: "strike",
    label: "Strike",
    icon: Strikethrough,
    isActive: (e) => e.isActive("strike"),
    run: (e) => e.chain().focus().toggleStrike().run(),
  },
  {
    kind: "toggle",
    id: "code",
    label: "Code",
    icon: Code,
    isActive: (e) => e.isActive("code"),
    run: (e) => e.chain().focus().toggleCode().run(),
  },
  {
    kind: "custom",
    id: "link",
    component: LinkPopover,
  },
  {
    kind: "toggle",
    id: "bullet-list",
    label: "Bullet list",
    icon: List,
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    kind: "toggle",
    id: "ordered-list",
    label: "Ordered list",
    icon: ListOrdered,
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    kind: "toggle",
    id: "code-block",
    label: "Code block",
    icon: Code2,
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];
