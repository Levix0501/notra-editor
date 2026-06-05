import type { Editor } from "@tiptap/core";

import { Button } from "@/components/ui/button";

import { useTranslate } from "../i18n/react";
import { bubbleMenuItems, type ToggleItem } from "./items";

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
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t(item.labelKey)}
      data-active={item.isActive(editor) ? "true" : "false"}
      className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      onMouseDown={(e) => {
        e.preventDefault();
        item.run(editor);
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
