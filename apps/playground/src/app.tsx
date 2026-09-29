import { NotraEditor, NotraKit, type NotraLocale, SlashMenu, useNotraEditor } from '@notra/editor'
import type { JSONContent } from '@tiptap/core'
import { useEffect, useState } from 'react'
import { sampleDocument } from './sample-document'

const extensions = [NotraKit]

const localeNames: Record<NotraLocale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

function DocumentActions() {
  const editor = useNotraEditor()
  const buttonClassName =
    'rounded-md border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={buttonClassName}
        onClick={() => editor.chain().setMeta('addToHistory', false).clearContent().focus().run()}
      >
        Clear
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={() =>
          editor.chain().setMeta('addToHistory', false).setContent(sampleDocument).run()
        }
      >
        Reset
      </button>
    </div>
  )
}

export function App() {
  const [dark, setDark] = useState(false)
  const [locale, setLocale] = useState<NotraLocale>('en')
  const [json, setJson] = useState<JSONContent>(sampleDocument)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Notra Editor Playground</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dark}
                onChange={(event) => setDark(event.target.checked)}
              />
              Dark mode
            </label>
            <label className="flex items-center gap-2">
              Language
              <select
                className="rounded-md border border-input bg-background px-2 py-1"
                value={locale}
                onChange={(event) => setLocale(event.target.value as NotraLocale)}
              >
                {Object.entries(localeNames).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <NotraEditor.Root
          extensions={extensions}
          initialContent={sampleDocument}
          locale={locale}
          onUpdate={({ editor }) => setJson(editor.getJSON())}
        >
          <DocumentActions />
          <div className="min-h-64 rounded-lg border border-border px-6 py-4">
            <NotraEditor.Content />
          </div>
          <SlashMenu.Root>
            <SlashMenu.Content>
              <SlashMenu.Empty />
              <SlashMenu.List>{(item) => <SlashMenu.Item item={item} />}</SlashMenu.List>
            </SlashMenu.Content>
          </SlashMenu.Root>
        </NotraEditor.Root>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Document JSON</h2>
          <pre
            data-testid="document-json"
            className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs"
          >
            {JSON.stringify(json, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  )
}
