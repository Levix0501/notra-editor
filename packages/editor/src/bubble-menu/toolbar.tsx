import type { Editor } from "@tiptap/core";

import { type BubbleMenuItem, bubbleMenuItems } from "./items";
import { LinkPopover } from "./link-popover";

export function Toolbar({ editor }: { editor: Editor }) {
  const before = bubbleMenuItems.slice(0, 7);
  const after = bubbleMenuItems.slice(7);
  return (
    <div className="notra-bm-toolbar" role="toolbar">
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

function ToolbarButton({
  editor,
  item,
}: {
  editor: Editor;
  item: BubbleMenuItem;
}) {
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
      className="notra-bm-button"
    >
      <Icon className="notra-bm-icon" />
    </button>
  );
}
