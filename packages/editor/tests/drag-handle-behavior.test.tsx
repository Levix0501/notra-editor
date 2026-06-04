import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Capture the props the official DragHandle is called with, so the test can
// drive onElementDragStart/End. Children still render inline (passthrough).
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

    // Fake timers only for the drag callbacks (the drop handler refocuses on a
    // setTimeout); the editor was already created above under real timers.
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
