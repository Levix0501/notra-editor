import {
  EyeIcon,
  FileCodeIcon,
  FileTextIcon,
  type LucideIcon,
  MonitorIcon,
  MoonIcon,
  PencilLineIcon,
  SquarePenIcon,
  SunIcon,
} from "lucide-react"
import { type Editor, en, NotraEditorView, useNotraEditor, zhCN } from "notra-editor"
import { useEffect, useState } from "react"

import { Badge } from "#components/ui/badge.tsx"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "#components/ui/card.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#components/ui/tabs.tsx"
import { ToggleGroup, ToggleGroupItem } from "#components/ui/toggle-group.tsx"
import { sampleContent, sampleMarkdown } from "./sample-content.ts"

type ColorScheme = "light" | "dark" | "system"
type Locale = "en" | "zh-CN"
type Mode = "edit" | "read"
/** A rich text document, or a Markdown file whose unchanged blocks are kept verbatim. */
type DocumentKind = "rich-text" | "markdown"
type OutputFormat = "markdown" | "json" | "html"

const OUTPUT_FORMATS: readonly { value: OutputFormat; label: string }[] = [
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
]

/** Toggles the `.dark` class on `<html>`, like `next-themes` does. */
function useColorScheme(scheme: ColorScheme) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = scheme === "dark" || (scheme === "system" && media.matches)
      document.documentElement.classList.toggle("dark", dark)
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [scheme])
}

function serialize(editor: Editor, format: OutputFormat): string {
  switch (format) {
    case "markdown":
      return editor.getMarkdown()
    case "json":
      return JSON.stringify(editor.getJSON(), null, 2)
    case "html":
      return editor.getHTML()
  }
}

interface ChoiceProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T; label: string; icon?: LucideIcon }[]
  onChange: (value: T) => void
}

/** A single-choice segmented control. */
function Choice<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={([next]) => {
        const option = options.find((candidate) => candidate.value === next)
        if (option) onChange(option.value)
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.icon ? <option.icon /> : null}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function App() {
  const [scheme, setScheme] = useState<ColorScheme>("system")
  const [locale, setLocale] = useState<Locale>("en")
  const [mode, setMode] = useState<Mode>("edit")
  const [format, setFormat] = useState<OutputFormat>("markdown")
  const [documentKind, setDocumentKind] = useState<DocumentKind>("rich-text")
  const [output, setOutput] = useState("")

  useColorScheme(scheme)

  const isMarkdown = documentKind === "markdown"
  const editor = useNotraEditor(
    {
      content: isMarkdown ? sampleMarkdown : sampleContent,
      contentType: isMarkdown ? "markdown" : "html",
      markdown: { preserveSource: isMarkdown },
      editable: mode === "edit",
      dictionary: locale === "zh-CN" ? zhCN : en,
    },
    [documentKind],
  )

  useEffect(() => {
    // Expose the editor for debugging in the browser console.
    if (import.meta.env.DEV && editor) {
      Object.assign(window, { notraEditor: editor })
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const update = () => setOutput(serialize(editor, format))
    update()
    editor.on("update", update)
    return () => {
      editor.off("update", update)
    }
  }, [editor, format])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SquarePenIcon className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">notra-editor</span>
            <Badge variant="secondary">playground</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Choice
              label="Color scheme"
              value={scheme}
              onChange={setScheme}
              options={[
                { value: "light", label: "Light", icon: SunIcon },
                { value: "dark", label: "Dark", icon: MoonIcon },
                { value: "system", label: "System", icon: MonitorIcon },
              ]}
            />
            <Choice
              label="Language"
              value={locale}
              onChange={setLocale}
              options={[
                { value: "en", label: "English" },
                { value: "zh-CN", label: "简体中文" },
              ]}
            />
            <Choice
              label="Document"
              value={documentKind}
              onChange={setDocumentKind}
              options={[
                { value: "rich-text", label: "Rich text", icon: FileTextIcon },
                { value: "markdown", label: "Markdown file", icon: FileCodeIcon },
              ]}
            />
            <Choice
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "edit", label: "Edit", icon: PencilLineIcon },
                { value: "read", label: "Read only", icon: EyeIcon },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Not `overflow-hidden`: the editor menus are positioned inside of the editor. */}
        <Card className="overflow-visible py-0">
          <NotraEditorView editor={editor} className="min-h-[640px] rounded-xl bg-transparent py-8" />
        </Card>

        <Card className="lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)]">
          <Tabs
            value={format}
            onValueChange={(value: OutputFormat) => setFormat(value)}
            className="min-h-0 flex-1 gap-(--card-spacing)"
          >
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>Updates as you type.</CardDescription>
              <CardAction>
                <TabsList>
                  {OUTPUT_FORMATS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardAction>
            </CardHeader>
            {OUTPUT_FORMATS.map((option) => (
              <TabsContent key={option.value} value={option.value} className="min-h-0 px-(--card-spacing)">
                <pre className="h-full overflow-auto rounded-lg bg-muted p-4 font-mono text-xs/relaxed whitespace-pre-wrap">
                  {output}
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </main>
    </div>
  )
}
