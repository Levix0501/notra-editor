import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { I18nProvider, useTranslate } from "../src/i18n/react";

function makeI18n(locale: string) {
  return createI18n<MessageKey>({ locale, catalogs: builtinCatalogs, fallbackLocale: "en" });
}

describe("useTranslate", () => {
  it("returns the default (en) instance when no Provider is present", () => {
    const { result } = renderHook(() => useTranslate());
    expect(result.current("aria.dragToMove")).toBe("Drag to move");
  });

  it("reads from the provided instance and re-renders on setLocale", () => {
    const i18n = makeI18n("en");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider value={i18n}>{children}</I18nProvider>
    );
    const { result } = renderHook(() => useTranslate(), { wrapper });
    expect(result.current("aria.dragToMove")).toBe("Drag to move");
    act(() => i18n.setLocale("zh"));
    expect(result.current("aria.dragToMove")).toBe("拖动以移动");
  });

  it("re-renders a component subtree when locale changes", () => {
    const i18n = makeI18n("en");
    function Label() {
      const t = useTranslate();
      return <span>{t("bubble.bold.label")}</span>;
    }
    const { container } = render(
      <I18nProvider value={i18n}>
        <Label />
      </I18nProvider>,
    );
    expect(container.textContent).toBe("Bold");
    act(() => i18n.setLocale("zh"));
    expect(container.textContent).toBe("加粗");
  });
});
