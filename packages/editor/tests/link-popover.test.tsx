import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LinkPopover } from "../src/bubble-menu/link-popover";
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

describe("LinkPopover trigger", () => {
  it("renders a link trigger with localized aria-label (en)", () => {
    const { editor, i18n } = setup("en");
    const { getByLabelText } = render(
      <I18nProvider value={i18n}>
        <LinkPopover editor={editor} />
      </I18nProvider>,
    );
    expect(getByLabelText("Link")).toBeTruthy();
  });

  it("localizes the aria-label (zh)", () => {
    const { editor, i18n } = setup("zh");
    const { getByLabelText } = render(
      <I18nProvider value={i18n}>
        <LinkPopover editor={editor} />
      </I18nProvider>,
    );
    expect(getByLabelText("链接")).toBeTruthy();
  });
});
