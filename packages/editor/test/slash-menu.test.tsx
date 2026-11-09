import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { Editor } from "@tiptap/core"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NotraEditor } from "../src/components/notra-editor"

async function renderEditor(): Promise<Editor> {
  let editor: Editor | undefined
  render(
    <NotraEditor
      content="<p></p>"
      onCreate={(instance) => {
        editor = instance
      }}
    />,
  )
  await waitFor(() => expect(editor).toBeDefined())
  return editor as Editor
}

function type(editor: Editor, text: string) {
  act(() => {
    editor.chain().focus().insertContent(text).run()
  })
}

function pressKey(editor: Editor, key: string) {
  act(() => {
    fireEvent.keyDown(editor.view.dom, { key })
  })
}

function selectedOption(): HTMLElement | undefined {
  return screen.getAllByRole("option").find((option) => option.getAttribute("aria-selected") === "true")
}

describe("slash menu", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("lists the commands in groups", async () => {
    const editor = await renderEditor()
    type(editor, "/")

    expect(await screen.findByRole("listbox")).toBeDefined()
    expect(screen.getByText("Basic blocks")).toBeDefined()
    expect(screen.getByRole("option", { name: /Heading 1/ })).toBeDefined()
    expect(selectedOption()?.textContent).toContain("Text")
  })

  it("navigates with the keyboard and runs the selected command", async () => {
    const editor = await renderEditor()
    type(editor, "/")
    await screen.findByRole("listbox")

    pressKey(editor, "ArrowDown")
    await waitFor(() => expect(selectedOption()?.textContent).toContain("Heading 1"))

    pressKey(editor, "Enter")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    expect(editor.getJSON().content?.[0]?.type).toBe("heading")
  })

  it("filters the commands with the query", async () => {
    const editor = await renderEditor()
    type(editor, "/quo")

    await waitFor(() => expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Quote>"]))
    expect(screen.queryByText("Basic blocks")).toBeNull()

    type(editor, "xyz")
    expect(await screen.findByText("No results")).toBeDefined()
  })

  // The menu used to follow the selection with `scrollIntoView()`, which scrolls
  // the page too. When the menu opened, it was still at the end of the document,
  // waiting for Floating UI to position it, so the page jumped to the bottom.
  it("does not scroll the page", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
    const editor = await renderEditor()
    type(editor, "/")
    expect(document.querySelector<HTMLElement>("[data-notra-slash-menu]")?.style.position).toMatch(/^(fixed|absolute)$/)

    await screen.findByRole("listbox")
    pressKey(editor, "ArrowUp")
    await waitFor(() => expect(selectedOption()?.textContent).not.toContain("Text"))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
