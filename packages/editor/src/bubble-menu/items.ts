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

import type { MessageKey } from "../i18n/messages";
import { LinkPopover } from "./link-popover";

export type ToggleItem = {
  kind: "toggle";
  id: string;
  labelKey: MessageKey;
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
    labelKey: "bubble.heading-1.label",
    icon: Heading1,
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    kind: "toggle",
    id: "heading-2",
    labelKey: "bubble.heading-2.label",
    icon: Heading2,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    kind: "toggle",
    id: "heading-3",
    labelKey: "bubble.heading-3.label",
    icon: Heading3,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    kind: "toggle",
    id: "bold",
    labelKey: "bubble.bold.label",
    icon: Bold,
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    kind: "toggle",
    id: "italic",
    labelKey: "bubble.italic.label",
    icon: Italic,
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    kind: "toggle",
    id: "strike",
    labelKey: "bubble.strike.label",
    icon: Strikethrough,
    isActive: (e) => e.isActive("strike"),
    run: (e) => e.chain().focus().toggleStrike().run(),
  },
  {
    kind: "toggle",
    id: "code",
    labelKey: "bubble.code.label",
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
    labelKey: "bubble.bullet-list.label",
    icon: List,
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    kind: "toggle",
    id: "ordered-list",
    labelKey: "bubble.ordered-list.label",
    icon: ListOrdered,
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    kind: "toggle",
    id: "code-block",
    labelKey: "bubble.code-block.label",
    icon: Code2,
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];
