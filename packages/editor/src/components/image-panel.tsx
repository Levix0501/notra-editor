import type { PopoverRoot } from "@base-ui/react/popover"
import type { Editor } from "@tiptap/core"
import { LinkIcon, UploadIcon } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"

import { useDictionary } from "#components/dictionary-context.tsx"
import { Button } from "#components/ui/button.tsx"
import { FieldError, FieldSeparator } from "#components/ui/field.tsx"
import { InputGroup, InputGroupAddon, InputGroupInput } from "#components/ui/input-group.tsx"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle } from "#components/ui/popover.tsx"
import { Spinner } from "#components/ui/spinner.tsx"
import { resolveImageSource } from "#extensions/image-upload.ts"
import { getNotraStorage } from "#extensions/notra-core.ts"

type Anchor = { getBoundingClientRect: () => DOMRect; contextElement: Element }
type Status = "idle" | "uploading" | "error"

/** The "add an image" panel, opened from the slash menu at the cursor position. */
export function ImagePanel({ editor }: { editor: Editor }) {
  const dictionary = useDictionary()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storage = getNotraStorage(editor)
    const openPanel = () => {
      const position = editor.state.selection.from
      setAnchor({
        getBoundingClientRect: () => {
          const coords = editor.view.coordsAtPos(Math.min(position, editor.state.doc.content.size))
          return new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top)
        },
        contextElement: editor.view.dom,
      })
      setUrl("")
      setStatus("idle")
      setOpen(true)
    }
    storage.openImagePanel = openPanel
    return () => {
      if (storage.openImagePanel === openPanel) {
        storage.openImagePanel = undefined
      }
    }
  }, [editor])

  const handleOpenChange = (nextOpen: boolean, details: PopoverRoot.ChangeEventDetails) => {
    setOpen(nextOpen)
    if (!nextOpen && details.reason === "escape-key") {
      editor.commands.focus()
    }
  }

  const insertImage = (src: string) => {
    editor.chain().focus().setImage({ src }).run()
    setOpen(false)
  }

  const embed = (event: FormEvent) => {
    event.preventDefault()
    const src = url.trim()
    if (src) insertImage(src)
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setStatus("uploading")
    try {
      insertImage(await resolveImageSource(editor, file))
      setStatus("idle")
    } catch (error) {
      console.error("[notra-editor] Failed to upload image:", error)
      setStatus("error")
    }
  }

  const uploading = status === "uploading"

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverContent
        anchor={anchor}
        side="bottom"
        align="start"
        sideOffset={8}
        initialFocus={inputRef}
        finalFocus={false}
        className="nt:w-80"
      >
        <PopoverHeader>
          <PopoverTitle>{dictionary.image.title}</PopoverTitle>
        </PopoverHeader>
        <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <Spinner /> : <UploadIcon />}
          {uploading ? dictionary.image.uploading : dictionary.image.upload}
        </Button>
        <FieldSeparator className="nt:*:data-[slot=field-separator-content]:bg-popover">
          {dictionary.image.or}
        </FieldSeparator>
        <form onSubmit={embed} className="nt:flex nt:items-center nt:gap-2">
          <InputGroup>
            <InputGroupInput
              ref={inputRef}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={dictionary.image.urlPlaceholder}
              aria-label={dictionary.image.urlPlaceholder}
            />
            <InputGroupAddon>
              <LinkIcon />
            </InputGroupAddon>
          </InputGroup>
          <Button type="submit">{dictionary.image.embed}</Button>
        </form>
        {status === "error" ? <FieldError>{dictionary.image.uploadError}</FieldError> : null}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={upload} />
      </PopoverContent>
    </Popover>
  )
}
