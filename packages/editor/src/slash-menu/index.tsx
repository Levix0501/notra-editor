import type { Editor } from "@tiptap/core";
import { useEffect, useRef } from "react";

import { SlashMenuList } from "./menu-list";
import { useSlashMenu } from "./use-slash-menu";

const LIST_CLASS =
  "z-50 flex max-h-80 min-w-56 flex-col gap-0.5 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none";

export function NotraSlashMenu({ editor }: { editor: Editor | null }) {
  const { view, isMounted, refs, style, onSelect, onPointerEnter } = useSlashMenu({ editor });
  const listRef = useRef<HTMLDivElement | null>(null);

  // Keep the active row scrolled into view when the highlight moves.
  useEffect(() => {
    const rows = listRef.current?.querySelectorAll("button");
    rows?.[view.activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [view.activeIndex]);

  // Hide the whole popover when there are no matches so an empty query reads as plain text
  // input. view (not state) drives this: during the close transition view retains the last
  // non-empty items, so a populated menu still fades out instead of vanishing instantly.
  if (!editor || !isMounted || view.items.length === 0) return null;

  return (
    <div
      ref={(node) => {
        refs.setFloating(node);
        listRef.current = node;
      }}
      style={style}
      className={LIST_CLASS}
      role="listbox"
    >
      <SlashMenuList
        items={view.items}
        activeIndex={view.activeIndex}
        grouped={view.query.trim() === ""}
        onSelect={onSelect}
        onPointerEnter={onPointerEnter}
      />
    </div>
  );
}
