// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const SRC = fileURLToPath(new URL("../src", import.meta.url))

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

const files = listSourceFiles(SRC).map((path) => ({
  name: relative(SRC, path),
  text: readFileSync(path, "utf8"),
}))

/**
 * The stylesheet only defines namespaced variables, so class names copied from
 * shadcn/ui must not reference its global variables (e.g. `var(--radius)`).
 * Use `--theme(--radius-md)` or `--theme(--color-foreground)` instead.
 */
describe("source conventions", () => {
  it("only references namespaced CSS variables", () => {
    const allowed = /^--(notra-|nt-)|^--gap$/
    const offenders = files.flatMap(({ name, text }) =>
      [...text.matchAll(/var\((--[\w-]+)/g)]
        .map((match) => match[1] ?? "")
        .filter((variable) => !allowed.test(variable))
        .map((variable) => `${name}: ${variable}`),
    )
    expect(offenders).toEqual([])
  })

  it("has no empty `nt:` class name tokens", () => {
    // The shadcn CLI prefixes empty class strings, producing `"nt:"`.
    const offenders = files.filter(({ text }) => /(?<![\w-])nt:(?=[\s"'`])/.test(text)).map(({ name }) => name)
    expect(offenders).toEqual([])
  })
})
