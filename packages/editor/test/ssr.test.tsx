// @vitest-environment node
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { NotraEditor } from "../src/components/notra-editor"

describe("server-side rendering", () => {
  it("renders without accessing browser APIs", () => {
    const html = renderToString(<NotraEditor content="<p>Hello</p>" immediatelyRender={false} theme="system" />)
    expect(html).toContain('data-notra-editor=""')
    expect(html).toContain("notra-editor")
  })
})
