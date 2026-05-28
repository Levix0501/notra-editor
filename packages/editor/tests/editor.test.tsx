import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NotraEditor } from "../src/editor";

describe("NotraEditor", () => {
  it("renders a contenteditable surface", () => {
    const { container } = render(<NotraEditor />);
    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).not.toBeNull();
  });

  it("renders initialContent", () => {
    const initialContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "hello" }],
        },
      ],
    };
    const { container } = render(<NotraEditor initialContent={initialContent} />);
    expect(container.textContent).toContain("hello");
  });

  it("calls onUpdate when the user types", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<NotraEditor onUpdate={onUpdate} autofocus />);
    const editable = container.querySelector<HTMLElement>('[contenteditable="true"]');
    expect(editable).not.toBeNull();
    editable?.focus();
    await user.type(editable as HTMLElement, "hi");
    expect(onUpdate).toHaveBeenCalled();
    const lastCall = onUpdate.mock.calls.at(-1);
    expect(lastCall?.[0]).toMatchObject({ type: "doc" });
  });
});
