import type { Editor } from "@tiptap/core";
import { useEffect, useRef } from "react";

import { SlashMenuList } from "./menu-list";
import { useSlashMenu } from "./use-slash-menu";

const LIST_CLASS =
  "z-50 flex max-h-80 min-w-56 flex-col gap-0.5 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none";

export function NotraSlashMenu({ editor }: { editor: Editor | null }) {
  const { state, isMounted, refs, style, onSelect, onPointerEnter } = useSlashMenu({ editor });
  const listRef = useRef<HTMLDivElement | null>(null);

  // Keep the active row scrolled into view.
  useEffect(() => {
    const active = listRef.current?.querySelector('button[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [state.activeIndex, state.items]);

  if (!editor || !isMounted) return null;

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
        items={state.items}
        activeIndex={state.activeIndex}
        onSelect={onSelect}
        onPointerEnter={onPointerEnter}
      />
    </div>
  );
}
