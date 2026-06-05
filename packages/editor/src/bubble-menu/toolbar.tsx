import type { Editor } from "@tiptap/core";

import { useTranslate } from "../i18n/react";
import { bubbleMenuItems, type ToggleItem } from "./items";

const BUTTON_CLASS =
  "inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground";

const ICON_CLASS = "h-4 w-4";

export function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5" role="toolbar">
      {bubbleMenuItems.map((item) =>
        item.kind === "custom" ? (
          <item.component key={item.id} editor={editor} />
        ) : (
          <ToolbarButton key={item.id} editor={editor} item={item} />
        ),
      )}
    </div>
  );
}

function ToolbarButton({ editor, item }: { editor: Editor; item: ToggleItem }) {
  const t = useTranslate();
  const Icon = item.icon;
  return (
    <button
      type="button"
      aria-label={t(item.labelKey)}
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
