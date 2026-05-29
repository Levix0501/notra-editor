import * as Popover from "@radix-ui/react-popover";
import type { Editor } from "@tiptap/core";
import { Link as LinkIcon } from "lucide-react";
import { useState } from "react";

const BUTTON_CLASS =
  "inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground";

const ICON_CLASS = "h-4 w-4";

const CONTENT_CLASS =
  "z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none";

const FORM_CLASS = "flex items-center gap-1";

const INPUT_CLASS =
  "h-7 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-ring";

const APPLY_CLASS =
  "h-7 rounded-md bg-primary px-2 text-sm text-primary-foreground hover:bg-primary/90";

export function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const current = editor.getAttributes("link").href;
      setUrl(typeof current === "string" ? current : "");
    } else {
      setUrl("");
    }
    setOpen(nextOpen);
  };

  const apply = () => {
    if (url.trim().length > 0) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setUrl("");
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Link"
          data-active={editor.isActive("link") ? "true" : "false"}
          className={BUTTON_CLASS}
        >
          <LinkIcon className={ICON_CLASS} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={CONTENT_CLASS}
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <form
            className={FORM_CLASS}
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <input
              // biome-ignore lint/a11y/noAutofocus: focus is intentional for link-edit UX
              autoFocus
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={INPUT_CLASS}
            />
            <button type="submit" className={APPLY_CLASS}>
              Apply
            </button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
