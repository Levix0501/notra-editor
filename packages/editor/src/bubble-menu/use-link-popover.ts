import type { Editor } from "@tiptap/core";
import { Link as LinkIcon, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { sanitizeUrl } from "../lib/sanitize-url";

export function canSetLink(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false;
  try {
    return editor.can().setMark("link");
  } catch {
    return false;
  }
}

export function isLinkActive(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false;
  return editor.isActive("link");
}

// Mirrors notion-next's shouldShowLinkButton. notra's schema has no image node,
// so the image-caption guard is intentionally omitted (see design doc §5.2).
export function shouldShowLinkButton(editor: Editor | null, hideWhenUnavailable: boolean): boolean {
  if (!editor?.isEditable) return false;
  if (!hideWhenUnavailable) return true;
  if (!("link" in editor.schema.marks)) return false;
  if (!editor.isActive("code")) return canSetLink(editor);
  return true;
}

export type UseLinkPopoverConfig = {
  editor: Editor | null;
  hideWhenUnavailable?: boolean;
  onSetLink?: () => void;
};

export type UseLinkPopoverResult = {
  isVisible: boolean;
  canSet: boolean;
  isActive: boolean;
  url: string;
  setUrl: (next: string) => void;
  setLink: () => void;
  removeLink: () => void;
  openLink: (target?: string, features?: string) => void;
  label: string;
  Icon: LucideIcon;
};

export function useLinkPopover(config: UseLinkPopoverConfig): UseLinkPopoverResult {
  const { editor, hideWhenUnavailable = false, onSetLink } = config;
  const [url, setUrl] = useState("");
  const [isVisible, setIsVisible] = useState(() =>
    shouldShowLinkButton(editor, hideWhenUnavailable),
  );

  const canSet = canSetLink(editor);
  const isActive = isLinkActive(editor);

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const href = editor.getAttributes("link").href;
      setUrl(typeof href === "string" ? href : "");
      setIsVisible(shouldShowLinkButton(editor, hideWhenUnavailable));
    };
    sync();
    editor.on("selectionUpdate", sync);
    return () => {
      editor.off("selectionUpdate", sync);
    };
  }, [editor, hideWhenUnavailable]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const href = url.trim();
    if (href.length === 0) return; // empty apply is a no-op; removal goes through removeLink
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: href,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onSetLink?.();
  }, [editor, url, onSetLink]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .unsetLink()
      .setMeta("preventAutolink", true)
      .run();
    setUrl("");
  }, [editor]);

  const openLink = useCallback(
    (target = "_blank", features = "noopener,noreferrer") => {
      if (!url) return;
      const safe = sanitizeUrl(url, window.location.href);
      if (safe !== "#") window.open(safe, target, features);
    },
    [url],
  );

  return {
    isVisible,
    canSet,
    isActive,
    url,
    setUrl,
    setLink,
    removeLink,
    openLink,
    label: "Link",
    Icon: LinkIcon,
  };
}
