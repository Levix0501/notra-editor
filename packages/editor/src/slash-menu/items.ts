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

export type SlashMenuItem = {
  id: string;
  title: string;
  keywords: string[];
  icon: LucideIcon;
  run: (props: { editor: Editor; range: Range }) => void;
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
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading-2",
    title: "Heading 2",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    title: "Heading 3",
    keywords: ["h3", "heading"],
    icon: Heading3,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet-list",
    title: "Bullet List",
    keywords: ["bullet", "unordered", "list", "ul"],
    icon: List,
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    title: "Ordered List",
    keywords: ["ordered", "numbered", "list", "ol"],
    icon: ListOrdered,
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    title: "Quote",
    keywords: ["quote", "blockquote", "citation"],
    icon: TextQuote,
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    title: "Code Block",
    keywords: ["code", "codeblock", "pre", "snippet"],
    icon: Code2,
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

export function filterSlashItems(items: SlashMenuItem[], query: string): SlashMenuItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(q)),
  );
}
