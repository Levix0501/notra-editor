import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";

import { useFloatingBubble } from "./use-floating-bubble";

const SHELL_CLASS =
  "z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none";

export function FloatingBubbleShell({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const { open, refs, floatingStyles, getFloatingProps } = useFloatingBubble({ editor });

  if (!editor || !open) return null;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={SHELL_CLASS}
      {...getFloatingProps()}
    >
      {children}
    </div>
  );
}
