import { act, render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";

const dragHandleMock = vi.hoisted(() => ({ props: null as Record<string, any> | null }));
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: (props: Record<string, any>) => {
    dragHandleMock.props = props;
    return <>{props.children}</>;
  },
}));

import { NotraDragHandle } from "../src/drag-handle";
import { useNotraEditor } from "../src/use-notra-editor";

const helloDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
};

function Harness() {
  const editor = useNotraEditor({ content: helloDoc });
  return <NotraDragHandle editor={editor} />;
}

describe("NotraDragHandle — drag state", () => {
  it("hides while dragging and restores after the drop", () => {
    render(<Harness />);
    const wrapper = screen.getByRole("button", { name: "Drag to move" }).parentElement as HTMLElement;
    expect(wrapper.style.opacity).toBe("");

    vi.useFakeTimers();
    try {
      act(() => dragHandleMock.props?.onElementDragStart?.(new Event("dragstart")));
      expect(wrapper.style.opacity).toBe("0");

      act(() => {
        dragHandleMock.props?.onElementDragEnd?.(new Event("dragend"));
        vi.runOnlyPendingTimers();
      });
      expect(wrapper.style.opacity).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("NotraDragHandle — text selection", () => {
  it("hides while a non-empty text selection is active", async () => {
    let editorRef: Editor | null = null;
    function SelHarness() {
      const editor = useNotraEditor({ content: helloDoc });
      editorRef = editor;
      return <NotraDragHandle editor={editor} />;
    }
    render(<SelHarness />);
    const wrapper = screen.getByRole("button", { name: "Drag to move" }).parentElement as HTMLElement;
    expect(wrapper.style.opacity).toBe("");

    // Select the word "hello" (positions 1..6 inside the paragraph).
    act(() => {
      editorRef?.commands.setTextSelection({ from: 1, to: 6 });
    });
    await waitFor(() => expect(wrapper.style.opacity).toBe("0"));
  });
});
