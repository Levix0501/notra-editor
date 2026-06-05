import type { Editor } from "@tiptap/core";
import { Bold, Code, Italic, type LucideIcon, Strikethrough } from "lucide-react";
import type { ComponentType } from "react";

import type { MessageKey } from "../i18n/messages";
import { BlockTypeDropdown } from "./block-type-dropdown";
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

// Block-type conversions live in the leading dropdown; the inline marks stay as
// flat toggle buttons; link is the trailing custom popover.
export const bubbleMenuItems: BubbleMenuItem[] = [
  { kind: "custom", id: "block-type", component: BlockTypeDropdown },
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
  { kind: "custom", id: "link", component: LinkPopover },
];
