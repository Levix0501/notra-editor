import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";

import { Toolbar } from "./toolbar";

export function NotraBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} pluginKey="notra-bubble-menu" className="notra-bm-shell">
      <Toolbar editor={editor} />
    </BubbleMenu>
  );
}
