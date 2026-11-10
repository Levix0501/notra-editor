import type { PopoverRoot } from "@base-ui/react/popover"
import type { Editor } from "@tiptap/core"
import { ExternalLinkIcon, LinkIcon, PencilIcon, UnlinkIcon } from "lucide-react"
import { type FormEvent, useEffect, useRef, useState } from "react"

import { useDictionary } from "#components/dictionary-context.tsx"
import { ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import { InputGroup, InputGroupAddon, InputGroupInput } from "#components/ui/input-group.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "#components/ui/popover.tsx"
import { Separator } from "#components/ui/separator.tsx"
import { Toggle } from "#components/ui/toggle.tsx"
import { handleLinkClick } from "#extensions/link-click.ts"
import { getNotraStorage } from "#extensions/notra-core.ts"
import { normalizeUrl } from "#lib/url.ts"

interface LinkPopoverProps {
  editor: Editor
  /** Whether the selection is inside a link. */
  active: boolean
  /**
   * The trigger button: a toggle that shows whether the selection is a link,
   * or an "edit link" button.
   * @default "toggle"
   */
  trigger?: "toggle" | "edit"
  /** Register the popover as the target of the `Mod-K` shortcut. */
  registerShortcut?: boolean
}

export function LinkPopover({ editor, active, trigger = "toggle", registerShortcut = false }: LinkPopoverProps) {
  const dictionary = useDictionary()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!registerShortcut) {
      return
    }
    const storage = getNotraStorage(editor)
    const openPanel = () => {
      setUrl(editor.getAttributes("link").href ?? "")
      setOpen(true)
    }
    storage.openLinkPanel = openPanel
    return () => {
      if (storage.openLinkPanel === openPanel) {
        storage.openLinkPanel = undefined
      }
    }
  }, [editor, registerShortcut])

  const handleOpenChange = (nextOpen: boolean, details: PopoverRoot.ChangeEventDetails) => {
    if (nextOpen) {
      setUrl(editor.getAttributes("link").href ?? "")
    } else if (details.reason === "escape-key") {
      editor.commands.focus()
    }
    setOpen(nextOpen)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setOpen(false)
  }

  const applyLink = (event: FormEvent) => {
    event.preventDefault()
    const href = normalizeUrl(url)
    if (!href) {
      removeLink()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    setOpen(false)
  }

  const currentHref = editor.getAttributes("link").href as string | undefined
  const label = trigger === "edit" ? dictionary.link.edit : dictionary.bubbleMenu.link

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <ToolbarTooltip
        label={label}
        shortcut={trigger === "toggle" ? ["Mod", "K"] : undefined}
        render={
          <PopoverTrigger
            render={
              trigger === "edit" ? (
                <Button variant="ghost" size="icon-sm" aria-label={label}>
                  <PencilIcon />
                </Button>
              ) : (
                <Toggle size="sm" pressed={active} aria-label={label}>
                  <LinkIcon />
                </Toggle>
              )
            }
          />
        }
      />
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        initialFocus={inputRef}
        finalFocus={false}
        className="nt:w-80"
      >
        <form onSubmit={applyLink} className="nt:flex nt:items-center nt:gap-2">
          <InputGroup>
            <InputGroupInput
              ref={inputRef}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={dictionary.link.placeholder}
              aria-label={dictionary.bubbleMenu.link}
            />
            <InputGroupAddon>
              <LinkIcon />
            </InputGroupAddon>
          </InputGroup>
          <Button type="submit">{dictionary.link.apply}</Button>
        </form>
        {active && currentHref ? (
          <>
            <Separator />
            <div className="nt:flex nt:items-center nt:gap-1">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={currentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => handleLinkClick(editor, currentHref, event.nativeEvent)}
                  />
                }
              >
                <ExternalLinkIcon />
                {dictionary.link.open}
              </Button>
              <Button variant="ghost" size="sm" onClick={removeLink}>
                <UnlinkIcon />
                {dictionary.link.remove}
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
