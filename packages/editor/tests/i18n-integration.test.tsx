import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NotraEditor } from "../src/editor";

afterEach(() => {
  document.documentElement.removeAttribute("lang");
});

describe("NotraEditor i18n", () => {
  it("renders the placeholder for the detected <html lang>", async () => {
    document.documentElement.setAttribute("lang", "zh");
    const { container } = render(<NotraEditor />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const p = container.querySelector("p.is-editor-empty");
    expect(p?.getAttribute("data-placeholder")).toBe("开始输入…");
  });

  it("prefers an explicit placeholder prop over i18n", async () => {
    document.documentElement.setAttribute("lang", "zh");
    const { container } = render(<NotraEditor placeholder="Custom" />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const p = container.querySelector("p.is-editor-empty");
    expect(p?.getAttribute("data-placeholder")).toBe("Custom");
  });

  it("switches placeholder when <html lang> changes at runtime", async () => {
    const { container } = render(<NotraEditor />);
    await act(async () => {
      document.documentElement.setAttribute("lang", "zh");
      await new Promise((r) => setTimeout(r, 0));
    });
    const p = container.querySelector("p.is-editor-empty");
    expect(p?.getAttribute("data-placeholder")).toBe("开始输入…");
  });
});
