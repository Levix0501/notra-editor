import * as Popover from "@radix-ui/react-popover";
import type { Editor } from "@tiptap/core";
import { Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Link"
          data-active={editor.isActive("link") ? "true" : "false"}
          className="notra-bm-button"
        >
          <LinkIcon className="notra-bm-icon" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="notra-bm-popover"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <form
            className="notra-bm-link-form"
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
              className="notra-bm-link-input"
            />
            <button type="submit" className="notra-bm-link-apply">
              Apply
            </button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
