import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock DragHandle to render children inline (the real one portals into a
// detached DOM node invisible to happy-dom queries).
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { NotraDragHandle } from "../src/drag-handle";
import { useNotraEditor } from "../src/use-notra-editor";

const helloDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
};

function Harness({ editable = true }: { editable?: boolean }) {
  const editor = useNotraEditor({ content: helloDoc, editable });
  return <NotraDragHandle editor={editor} />;
}

describe("NotraDragHandle", () => {
  it("renders the handle button when the editor is editable", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "Drag to move" })).not.toBeNull();
  });

  it("renders a grip icon inside the handle", () => {
    render(<Harness />);
    const button = screen.getByRole("button", { name: "Drag to move" });
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("renders nothing when the editor is not editable", () => {
    render(<Harness editable={false} />);
    expect(screen.queryByRole("button", { name: "Drag to move" })).toBeNull();
  });
});
