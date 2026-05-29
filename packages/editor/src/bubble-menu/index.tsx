import type { Editor } from "@tiptap/core";

import { FloatingBubbleShell } from "./floating-shell";
import { Toolbar } from "./toolbar";

export function NotraBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <FloatingBubbleShell editor={editor}>
      <Toolbar editor={editor} />
    </FloatingBubbleShell>
  );
}
