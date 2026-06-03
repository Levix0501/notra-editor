import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The official DragHandle renders into a detached portal (invisible to happy-dom
// queries), so mock it to a passthrough — this lets us verify the handle is
// actually mounted into the editor tree. Same rationale as drag-handle.test.tsx.
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { NotraDragHandle } from "../src";
import { NotraEditor } from "../src/editor";

describe("NotraEditor with drag handle", () => {
  // Wiring check: proves NotraEditorContent actually mounts <NotraDragHandle>.
  // The component's own conditional-render behavior is unit-tested in
  // drag-handle.test.tsx; the DragHandle mock above is required because the real
  // one portals into a detached node invisible to happy-dom.
  it("mounts the drag handle alongside the editable surface", () => {
    const { container } = render(<NotraEditor />);
    expect(container.querySelector('[contenteditable="true"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Drag to move" })).not.toBeNull();
  });

  it("exports NotraDragHandle from the package entry", () => {
    expect(NotraDragHandle).toBeTypeOf("function");
  });
});
