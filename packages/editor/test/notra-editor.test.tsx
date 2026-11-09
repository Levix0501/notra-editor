import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { NotraEditor } from "../src/components/notra-editor"
import { zhCN } from "../src/i18n/zh-cn"

function getContent(container: HTMLElement): HTMLElement {
  const content = container.querySelector<HTMLElement>(".notra-content")
  if (!content) throw new Error("Editor content was not rendered")
  return content
}

describe("<NotraEditor />", () => {
  it("renders the initial content", async () => {
    const { container } = render(<NotraEditor content="<h1>Hello</h1><p>World</p>" />)
    await waitFor(() => expect(getContent(container).querySelector("h1")?.textContent).toBe("Hello"))
    expect(container.querySelector(".notra-editor")).toHaveProperty("dataset.editable", "true")
  })

  it("parses markdown content", async () => {
    const { container } = render(<NotraEditor content={"## Title\n\n- item"} contentType="markdown" />)
    await waitFor(() => expect(getContent(container).querySelector("h2")?.textContent).toBe("Title"))
    expect(getContent(container).querySelector("ul li")?.textContent).toBe("item")
  })

  it("calls onCreate with the editor instance", async () => {
    const onCreate = vi.fn()
    render(<NotraEditor content="<p>Hi</p>" onCreate={onCreate} />)
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate.mock.calls[0]?.[0].getText()).toBe("Hi")
  })

  it("can be read-only", async () => {
    const { container } = render(<NotraEditor content="<p>Read only</p>" editable={false} />)
    await waitFor(() => expect(getContent(container).getAttribute("contenteditable")).toBe("false"))
    expect(container.querySelector("[data-notra-block-handle]")).toBeNull()
  })

  it("applies a forced theme", async () => {
    const { container } = render(<NotraEditor theme="dark" />)
    await waitFor(() => expect(container.querySelector(".notra-editor")?.classList.contains("dark")).toBe(true))
  })

  it("shows the localized placeholder", async () => {
    const { container } = render(<NotraEditor dictionary={zhCN} autofocus />)
    await waitFor(() =>
      expect(getContent(container).querySelector("[data-placeholder]")?.getAttribute("data-placeholder")).toBe(
        zhCN.placeholder.default,
      ),
    )
  })
})
