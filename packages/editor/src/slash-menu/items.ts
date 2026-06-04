import type { Editor, Range } from "@tiptap/core";
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

import type { I18n } from "../i18n/core";
import type { MessageKey } from "../i18n/messages";
import { isNodeInSchema } from "../selection";

export type SlashGroupId = "basic" | "lists" | "blocks";

// Raw item: identity + behavior only. Display text lives in the i18n catalog.
export type SlashMenuItem = {
  id: string;
  icon: LucideIcon;
  run: (props: { editor: Editor; range: Range }) => void;
  groupId?: SlashGroupId;
  check?: (editor: Editor) => boolean;
};

// Finished item after translation — what the store, list, and filter consume.
export type ResolvedSlashMenuItem = SlashMenuItem & {
  title: string;
  subtitle?: string;
  group?: string;
  keywords: string[];
};

const checkHeading = (editor: Editor) => isNodeInSchema("heading", editor);

export const slashMenuItems: SlashMenuItem[] = [
  {
    id: "paragraph",
    icon: Pilcrow,
    groupId: "basic",
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "heading-1",
    icon: Heading1,
    groupId: "basic",
    check: checkHeading,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading-2",
    icon: Heading2,
    groupId: "basic",
    check: checkHeading,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    icon: Heading3,
    groupId: "basic",
    check: checkHeading,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    icon: List,
    groupId: "lists",
    check: (editor) => isNodeInSchema("bulletList", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    icon: ListOrdered,
    groupId: "lists",
    check: (editor) => isNodeInSchema("orderedList", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    icon: TextQuote,
    groupId: "blocks",
    check: (editor) => isNodeInSchema("blockquote", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    icon: Code2,
    groupId: "blocks",
    check: (editor) => isNodeInSchema("codeBlock", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

export function resolveSlashItems(
  items: SlashMenuItem[],
  i18n: I18n<MessageKey>,
): ResolvedSlashMenuItem[] {
  return items.map((item) => ({
    ...item,
    title: i18n.t(`slash.${item.id}.title` as MessageKey),
    subtitle: i18n.t(`slash.${item.id}.subtitle` as MessageKey),
    group: item.groupId ? i18n.t(`slash.group.${item.groupId}` as MessageKey) : undefined,
    keywords: i18n
      .t(`slash.${item.id}.keywords` as MessageKey)
      .split(/\s+/)
      .filter(Boolean),
  }));
}

// Lower rank = more relevant; null means no match. Matching scope is title +
// keywords only (subtitle is display-only, by design).
function matchRank(item: ResolvedSlashMenuItem, q: string): number | null {
  const title = item.title.toLowerCase();
  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  const keywords = item.keywords.map((k) => k.toLowerCase());
  if (keywords.some((k) => k === q)) return 2;
  if (keywords.some((k) => k !== q && k.startsWith(q))) return 3;
  if (title.includes(q) || keywords.some((k) => k.includes(q))) return 4;
  return null;
}

export function filterSlashItems(
  items: ResolvedSlashMenuItem[],
  query: string,
): ResolvedSlashMenuItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return items;
  const ranked = items
    .map((item, order) => ({ item, order, rank: matchRank(item, q) }))
    .filter(
      (entry): entry is { item: ResolvedSlashMenuItem; order: number; rank: number } =>
        entry.rank !== null,
    );
  ranked.sort((a, b) => a.rank - b.rank || a.order - b.order);
  return ranked.map((entry) => entry.item);
}

export function availableSlashItems<T extends { check?: (editor: Editor) => boolean }>(
  items: T[],
  editor: Editor,
): T[] {
  return items.filter((item) => item.check?.(editor) ?? true);
}
