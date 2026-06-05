import type { Editor } from "@tiptap/core";
import { CornerDownLeft, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { useTranslate } from "../i18n/react";
import { useLinkPopover } from "./use-link-popover";

const ICON_CLASS = "h-4 w-4";

export function LinkPopover({
  editor,
  autoOpenOnLinkActive = false,
}: {
  editor: Editor;
  autoOpenOnLinkActive?: boolean;
}) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const { isActive, url, setUrl, setLink, removeLink, openLink, Icon } = useLinkPopover({
    editor,
  });

  // Faithful to notion-next's autoOpenOnLinkActive (desktop default: off).
  useEffect(() => {
    if (autoOpenOnLinkActive && isActive) setOpen(true);
  }, [autoOpenOnLinkActive, isActive]);

  const apply = () => {
    setLink();
    setOpen(false);
  };

  const disabled = !url && !isActive;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("aria.link")}
            data-active={isActive ? "true" : "false"}
            className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
          >
            <Icon className={ICON_CLASS} />
          </Button>
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-auto p-1.5">
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            type="url"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            placeholder={t("link.placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            className="h-7 w-56"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t("link.apply")}
            title={t("link.apply")}
            onClick={apply}
          >
            <CornerDownLeft className={ICON_CLASS} />
          </Button>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t("link.open")}
            title={t("link.open")}
            onClick={() => openLink()}
          >
            <ExternalLink className={ICON_CLASS} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={t("link.remove")}
            title={t("link.remove")}
            onClick={() => {
              removeLink();
              setOpen(false);
            }}
          >
            <Trash2 className={ICON_CLASS} />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
