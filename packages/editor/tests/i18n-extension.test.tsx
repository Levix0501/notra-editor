import { renderHook } from "@testing-library/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { createI18n } from "../src/i18n/core";
import { builtinCatalogs, type MessageKey } from "../src/i18n/messages";
import { buildI18n, getI18n } from "../src/extensions/i18n";

function makeI18n() {
  return createI18n<MessageKey>({ locale: "en", catalogs: builtinCatalogs, fallbackLocale: "en" });
}

describe("buildI18n / getI18n", () => {
  it("exposes the instance on editor.storage.i18n", () => {
    const i18n = makeI18n();
    const { result } = renderHook(() =>
      useEditor({ extensions: [StarterKit, buildI18n(i18n)], immediatelyRender: false }),
    );
    const editor = result.current;
    expect(editor).not.toBeNull();
    if (!editor) return;
    expect(getI18n(editor)).toBe(i18n);
  });
});
