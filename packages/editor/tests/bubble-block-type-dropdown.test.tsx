import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlockTypeDropdown } from "../src/bubble-menu/block-type-dropdown";
import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { I18nProvider } from "../src/i18n/react";
import { useNotraEditor } from "../src/use-notra-editor";

function setup(locale: "en" | "zh") {
  const { result } = renderHook(() => useNotraEditor());
  const editor = result.current;
  if (!editor) throw new Error("editor not ready");
  const i18n = createI18n<MessageKey>({ locale, catalogs: builtinCatalogs });
  return { editor, i18n };
}

describe("BlockTypeDropdown trigger", () => {
  it("shows the paragraph label by default", () => {
    const { editor, i18n } = setup("en");
    const { getByLabelText } = render(
      <I18nProvider value={i18n}>
        <BlockTypeDropdown editor={editor} />
      </I18nProvider>,
    );
    const trigger = getByLabelText("Turn into");
    expect(trigger.textContent).toContain("Text");
  });

  it("reflects the current heading and localizes the aria-label", () => {
    const { editor, i18n } = setup("zh");
    editor.chain().focus().toggleHeading({ level: 1 }).run();
    const { getByLabelText } = render(
      <I18nProvider value={i18n}>
        <BlockTypeDropdown editor={editor} />
      </I18nProvider>,
    );
    const trigger = getByLabelText("转换为");
    expect(trigger.textContent).toContain("标题 1");
  });
});
