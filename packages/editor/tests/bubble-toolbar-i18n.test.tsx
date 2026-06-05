import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { I18nProvider } from "../src/i18n/react";
import { Toolbar } from "../src/bubble-menu/toolbar";
import { useNotraEditor } from "../src/use-notra-editor";

describe("bubble Toolbar i18n", () => {
  it("renders toggle aria-labels from the active locale", () => {
    const { result } = renderHook(() => useNotraEditor());
    const editor = result.current;
    if (!editor) throw new Error("editor not ready");
    const i18n = createI18n<MessageKey>({ locale: "zh", catalogs: builtinCatalogs });
    const { container } = render(
      <I18nProvider value={i18n}>
        <Toolbar editor={editor} />
      </I18nProvider>,
    );
    expect(container.querySelector('[aria-label="加粗"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="链接"]')).not.toBeNull();
  });
});
