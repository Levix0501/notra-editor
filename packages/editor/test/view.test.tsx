import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { Editor } from "@tiptap/core"
import { describe, expect, it, vi } from "vitest"

import { NotraEditor, type NotraEditorProps, NotraEditorView } from "../src/components/notra-editor"
import { useNotraEditor } from "../src/hooks/use-notra-editor"

async function renderEditor(props: NotraEditorProps) {
  let editor: Editor | undefined
  const result = render(
    <NotraEditor
      {...props}
      onCreate={(instance) => {
        editor = instance
      }}
    />,
  )
  await waitFor(() => expect(editor).toBeDefined())
  const content = result.container.querySelector<HTMLElement>(".notra-content")
  if (!content) throw new Error("Editor content was not rendered")
  return { ...result, editor: editor as Editor, content }
}

describe("portalContainer", () => {
  it("renders the slash menu into the container", async () => {
    const container = document.body.appendChild(document.createElement("div"))
    const { editor } = await renderEditor({ content: "<p></p>", portalContainer: container })

    act(() => {
      editor.chain().focus().insertContent("/").run()
    })
    await waitFor(() => expect(container.querySelector("[data-notra-slash-menu]")).not.toBeNull())

    act(() => {
      editor.chain().focus().deleteRange({ from: 1, to: 2 }).run()
    })
    await waitFor(() => expect(container.querySelector("[data-notra-slash-menu]")).toBeNull())
    container.remove()
  })
})

describe("onLinkClick", () => {
  it("opens links of read-only content", async () => {
    const onLinkClick = vi.fn(() => true)
    const { content } = await renderEditor({
      content: '<p><a href="/docs">Docs</a></p>',
      editable: false,
      onLinkClick,
    })
    const link = await waitFor(() => content.querySelector("a") as HTMLAnchorElement)

    const notPrevented = fireEvent.click(link)
    expect(onLinkClick).toHaveBeenCalledWith("/docs", expect.any(MouseEvent))
    expect(notPrevented).toBe(false)
  })

  it("lets the browser open the link when the handler does not handle it", async () => {
    const onLinkClick = vi.fn(() => undefined)
    const { content } = await renderEditor({
      content: '<p><a href="https://example.com">Example</a></p>',
      editable: false,
      onLinkClick,
    })
    const link = await waitFor(() => content.querySelector("a") as HTMLAnchorElement)
    // jsdom does not navigate; the default action is simply not prevented.
    expect(fireEvent.click(link)).toBe(true)
    expect(onLinkClick).toHaveBeenCalledTimes(1)
  })

  it("does not open links while editing", async () => {
    const onLinkClick = vi.fn(() => true)
    const { content } = await renderEditor({ content: '<p><a href="/docs">Docs</a></p>', onLinkClick })
    fireEvent.click(await waitFor(() => content.querySelector("a") as HTMLAnchorElement))
    expect(onLinkClick).not.toHaveBeenCalled()
  })
})

describe("resolveImageUrl", () => {
  it("displays images from the resolved URL and keeps the stored src", async () => {
    const { editor, content } = await renderEditor({
      content: '<img src="images/a.png" alt="A">',
      resolveImageUrl: (src) => `https://cdn.example.com/${src}`,
    })
    const image = await waitFor(() => content.querySelector("img") as HTMLImageElement)
    expect(image.getAttribute("src")).toBe("https://cdn.example.com/images/a.png")
    expect(image.getAttribute("alt")).toBe("A")
    expect(editor.getHTML()).toContain('src="images/a.png"')
  })

  it("supports asynchronous resolution", async () => {
    const { content } = await renderEditor({
      content: '<img src="private-key">',
      features: { image: { resize: false } },
      resolveImageUrl: async (src) => `https://signed.example.com/${src}?token=1`,
    })
    await waitFor(() =>
      expect(content.querySelector("img")?.getAttribute("src")).toBe("https://signed.example.com/private-key?token=1"),
    )
  })
})

describe("renderRawBlock", () => {
  it("displays source blocks with the renderer of the application", async () => {
    const { content } = await renderEditor({
      content: "---\ntitle: Hello\n---\n\nText",
      contentType: "markdown",
      renderRawBlock: (source, kind) => (kind === "frontmatter" ? <dl data-testid="properties">{source}</dl> : null),
    })
    expect((await screen.findByTestId("properties")).textContent).toBe("title: Hello")
    expect(content.querySelector<HTMLElement>('pre[data-type="raw-block"]')?.hidden).toBe(true)
  })

  it("shows the source when the renderer returns nothing", async () => {
    const { content } = await renderEditor({
      content: "<!-- comment -->\n\nText",
      contentType: "markdown",
      renderRawBlock: () => null,
    })
    const source = await waitFor(() => content.querySelector<HTMLElement>('pre[data-type="raw-block"]') as HTMLElement)
    expect(source.hidden).toBe(false)
    expect(source.textContent).toBe("<!-- comment -->")
  })
})

/** A document whose editor is re-created when it switches to Markdown. */
function Document({ markdown }: { markdown: boolean }) {
  const editor = useNotraEditor(
    { content: markdown ? "# Markdown" : "<h1>HTML</h1>", contentType: markdown ? "markdown" : "html" },
    [markdown],
  )
  return <NotraEditorView editor={editor} />
}

describe("NotraEditorView", () => {
  it("renders an editor that is re-created when its dependencies change", async () => {
    const { container, rerender } = render(<Document markdown={false} />)
    await waitFor(() => expect(container.querySelector("h1")?.textContent).toBe("HTML"))
    rerender(<Document markdown />)
    await waitFor(() => expect(container.querySelector("h1")?.textContent).toBe("Markdown"))
  })
})
