import type { Editor } from "@tiptap/core";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTranslate } from "../i18n/react";
import { activeBlockType, applyBlockType, blockTypes } from "./block-types";

export function BlockTypeDropdown({ editor }: { editor: Editor }) {
  const t = useTranslate();
  const active = activeBlockType(editor);
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("bubble.turn-into.label")}
            className="gap-1 px-1.5"
          >
            <ActiveIcon className="h-4 w-4" />
            <span>{t(active.labelKey)}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-40">
        {blockTypes.map((b) => {
          const Icon = b.icon;
          const isActive = b.id === active.id;
          return (
            <DropdownMenuItem
              key={b.id}
              data-active={isActive ? "true" : "false"}
              className="gap-2 data-[active=true]:font-medium"
              onClick={() => applyBlockType(editor, b)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{t(b.labelKey)}</span>
              {isActive ? <Check className="h-4 w-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
