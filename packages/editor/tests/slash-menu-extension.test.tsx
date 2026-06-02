import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getSlashStore } from "../src/slash-menu/extension";
import { useNotraEditor } from "../src/use-notra-editor";

describe("slash command extension (default-installed)", () => {
  it("installs a slash store on editor storage by default", () => {
    const { result } = renderHook(() => useNotraEditor());
    const editor = result.current;
    expect(editor).not.toBeNull();
    if (!editor) return;
    const store = getSlashStore(editor);
    expect(store).not.toBeNull();
    expect(store?.getSnapshot().open).toBe(false);
    expect(typeof store?.subscribe).toBe("function");
  });
});
