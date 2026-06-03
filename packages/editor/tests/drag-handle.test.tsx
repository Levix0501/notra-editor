import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock DragHandle to render children inline (avoid createPortal into detached DOM)
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { NotraDragHandle } from "../src/drag-handle";
import { GripIcon } from "../src/drag-handle/grip-icon";
import { useNotraEditor } from "../src/use-notra-editor";

describe("GripIcon", () => {
  it("renders an svg with six dots", () => {
    const { container } = render(<GripIcon />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });
});

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

  it("renders nothing when the editor is not editable", () => {
    render(<Harness editable={false} />);
    expect(screen.queryByRole("button", { name: "Drag to move" })).toBeNull();
  });
});
