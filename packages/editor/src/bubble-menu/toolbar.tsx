import type { Editor } from "@tiptap/core";

import { type BubbleMenuItem, bubbleMenuItems } from "./items";
import { LinkPopover } from "./link-popover";

const BUTTON_CLASS =
  "inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground";

const ICON_CLASS = "h-4 w-4";

export function Toolbar({ editor }: { editor: Editor }) {
  const before = bubbleMenuItems.slice(0, 7);
  const after = bubbleMenuItems.slice(7);
  return (
    <div className="flex items-center gap-0.5" role="toolbar">
      {before.map((item) => (
        <ToolbarButton key={item.id} editor={editor} item={item} />
      ))}
      <LinkPopover editor={editor} />
      {after.map((item) => (
        <ToolbarButton key={item.id} editor={editor} item={item} />
      ))}
    </div>
  );
}

function ToolbarButton({ editor, item }: { editor: Editor; item: BubbleMenuItem }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      aria-label={item.label}
      data-active={item.isActive(editor) ? "true" : "false"}
      onMouseDown={(e) => {
        e.preventDefault();
        item.run(editor);
      }}
      className={BUTTON_CLASS}
    >
      <Icon className={ICON_CLASS} />
    </button>
  );
}
