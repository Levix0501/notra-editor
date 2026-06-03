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

import { isNodeInSchema } from "../selection";

export type SlashMenuItem = {
  id: string;
  title: string;
  keywords: string[];
  icon: LucideIcon;
  run: (props: { editor: Editor; range: Range }) => void;
  group?: string;
  subtitle?: string;
  check?: (editor: Editor) => boolean;
};

export const slashMenuItems: SlashMenuItem[] = [
  {
    id: "paragraph",
    title: "Text",
    keywords: ["text", "paragraph", "p", "body"],
    icon: Pilcrow,
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "heading-1",
    title: "Heading 1",
    keywords: ["h1", "heading", "title", "big"],
    icon: Heading1,
    check: (editor) => isNodeInSchema("heading", editor),
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading-2",
    title: "Heading 2",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    check: (editor) => isNodeInSchema("heading", editor),
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    title: "Heading 3",
    keywords: ["h3", "heading"],
    icon: Heading3,
    check: (editor) => isNodeInSchema("heading", editor),
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    title: "Bullet List",
    keywords: ["bullet", "unordered", "list", "ul"],
    icon: List,
    check: (editor) => isNodeInSchema("bulletList", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    title: "Ordered List",
    keywords: ["ordered", "numbered", "list", "ol"],
    icon: ListOrdered,
    check: (editor) => isNodeInSchema("orderedList", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    title: "Quote",
    keywords: ["quote", "blockquote", "citation"],
    icon: TextQuote,
    check: (editor) => isNodeInSchema("blockquote", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    title: "Code Block",
    keywords: ["code", "codeblock", "pre", "snippet"],
    icon: Code2,
    check: (editor) => isNodeInSchema("codeBlock", editor),
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

// Lower rank = more relevant; null means no match. Matching scope is title +
// keywords only (subtitle is display-only, by design).
function matchRank(item: SlashMenuItem, q: string): number | null {
  const title = item.title.toLowerCase();
  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  const keywords = item.keywords.map((k) => k.toLowerCase());
  if (keywords.some((k) => k === q)) return 2;
  // rank 3: keyword strict prefix (exact keywords already returned at rank 2)
  if (keywords.some((k) => k !== q && k.startsWith(q))) return 3;
  if (title.includes(q) || keywords.some((k) => k.includes(q))) return 4;
  return null;
}

export function filterSlashItems(items: SlashMenuItem[], query: string): SlashMenuItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return items;
  const ranked = items
    .map((item, order) => ({ item, order, rank: matchRank(item, q) }))
    .filter(
      (entry): entry is { item: SlashMenuItem; order: number; rank: number } => entry.rank !== null,
    );
  ranked.sort((a, b) => a.rank - b.rank || a.order - b.order);
  return ranked.map((entry) => entry.item);
}

export function availableSlashItems(items: SlashMenuItem[], editor: Editor): SlashMenuItem[] {
  return items.filter((item) => item.check?.(editor) ?? true);
}
