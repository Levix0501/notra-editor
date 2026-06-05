import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Editor } from "@tiptap/core";
import { Check, ChevronDown } from "lucide-react";

import { useTranslate } from "../i18n/react";
import { activeBlockType, blockTypes } from "./block-types";

const TRIGGER_CLASS =
  "inline-flex h-7 items-center gap-1 rounded px-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground";

const ICON_CLASS = "h-4 w-4";
const CHEVRON_CLASS = "h-3 w-3 opacity-60";

const CONTENT_CLASS =
  "z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[active=true]:font-medium";

export function BlockTypeDropdown({ editor }: { editor: Editor }) {
  const t = useTranslate();
  const active = activeBlockType(editor);
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" aria-label={t("bubble.turn-into.label")} className={TRIGGER_CLASS}>
          <ActiveIcon className={ICON_CLASS} />
          <span>{t(active.labelKey)}</span>
          <ChevronDown className={CHEVRON_CLASS} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={CONTENT_CLASS}
          align="start"
          sideOffset={6}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {blockTypes.map((b) => {
            const Icon = b.icon;
            const isActive = b.id === active.id;
            return (
              <DropdownMenu.Item
                key={b.id}
                className={ITEM_CLASS}
                data-active={isActive ? "true" : "false"}
                onSelect={(e) => {
                  e.preventDefault();
                  b.run(editor);
                }}
              >
                <Icon className={ICON_CLASS} />
                <span className="flex-1">{t(b.labelKey)}</span>
                {isActive ? <Check className={ICON_CLASS} /> : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
