import type { Editor } from "@tiptap/core"
import { NodeSelection, PluginKey } from "@tiptap/pm/state"
import { useEditorState } from "@tiptap/react"
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus"
import {
  BoldIcon,
  CodeIcon,
  ExternalLinkIcon,
  ItalicIcon,
  type LucideIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnlinkIcon,
} from "lucide-react"
import { useMemo, useRef, useState } from "react"

import { getActiveBlockType } from "#blocks/block-types.ts"
import { useDictionary } from "#components/dictionary-context.tsx"
import { preventFocusLoss, Toolbar, ToolbarSeparator, ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import { ToggleGroup, ToggleGroupItem } from "#components/ui/toggle-group.tsx"
import { useHideMenuOnFocusLeave } from "#hooks/use-hide-menu-on-focus-leave.ts"
import { NotraPortalContext, useNotraPortal } from "#lib/portal.tsx"
import { ColorPopover } from "./color-popover"
import { LinkPopover } from "./link-popover"
import { TurnIntoMenu } from "./turn-into-menu"

type MarkName = "bold" | "italic" | "underline" | "strike" | "code"

interface MarkDefinition {
  name: MarkName
  icon: LucideIcon
  shortcut: readonly string[]
}

const MARKS: readonly MarkDefinition[] = [
  { name: "bold", icon: BoldIcon, shortcut: ["Mod", "B"] },
  { name: "italic", icon: ItalicIcon, shortcut: ["Mod", "I"] },
  { name: "underline", icon: UnderlineIcon, shortcut: ["Mod", "U"] },
  { name: "strike", icon: StrikethroughIcon, shortcut: ["Mod", "Shift", "S"] },
  { name: "code", icon: CodeIcon, shortcut: ["Mod", "E"] },
]

const BUBBLE_MENU_OPTIONS: BubbleMenuProps["options"] = {
  placement: "top-start",
  offset: 8,
  flip: true,
  shift: { padding: 8 },
}

const shouldShowBubbleMenu: NonNullable<BubbleMenuProps["shouldShow"]> = ({
  editor,
  view,
  state,
  from,
  to,
  element,
}) => {
  if (!editor.isEditable) return false

  const hasFocus = view.hasFocus() || element.contains(document.activeElement)
  if (!hasFocus) return false

  const { selection } = state
  if (selection instanceof NodeSelection) return false
  if (editor.isActive("codeBlock")) return false

  // A collapsed cursor inside a link shows the link toolbar.
  if (selection.empty) return editor.isActive("link")

  return state.doc.textBetween(from, to, " ").trim().length > 0
}

function MarkToggleGroup({ editor, active }: { editor: Editor; active: MarkName[] }) {
  const dictionary = useDictionary()

  return (
    <ToggleGroup multiple size="sm" spacing={0.5} value={active}>
      {MARKS.map((mark) => {
        const Icon = mark.icon
        const label = dictionary.bubbleMenu[mark.name]
        return (
          <ToolbarTooltip
            key={mark.name}
            label={label}
            shortcut={mark.shortcut}
            render={
              <ToggleGroupItem
                value={mark.name}
                aria-label={label}
                onMouseDown={preventFocusLoss}
                onPressedChange={() => editor.chain().focus().toggleMark(mark.name).run()}
              >
                <Icon />
              </ToggleGroupItem>
            }
          />
        )
      })}
    </ToggleGroup>
  )
}

function LinkToolbar({ editor, href }: { editor: Editor; href: string }) {
  const dictionary = useDictionary()

  return (
    <Toolbar>
      <Button
        variant="link"
        size="sm"
        className="nt:max-w-64 nt:font-normal"
        nativeButton={false}
        render={<a href={href} target="_blank" rel="noopener noreferrer" />}
      >
        <span className="nt:truncate">{href}</span>
      </Button>
      <ToolbarSeparator />
      <LinkPopover editor={editor} active trigger="edit" />
      <ToolbarTooltip
        label={dictionary.link.open}
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.link.open}
            nativeButton={false}
            render={<a href={href} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLinkIcon />
          </Button>
        }
      />
      <ToolbarTooltip
        label={dictionary.link.remove}
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.link.remove}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
          >
            <UnlinkIcon />
          </Button>
        }
      />
    </Toolbar>
  )
}

function BubbleMenuToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      empty: instance.state.selection.empty,
      blockTypeId: getActiveBlockType(instance)?.id,
      marks: MARKS.filter((mark) => instance.isActive(mark.name))
        .map((mark) => mark.name)
        .join(" "),
      link: instance.isActive("link"),
      href: instance.getAttributes("link").href as string | undefined,
      textColor: instance.getAttributes("textStyle").color as string | undefined,
      highlightColor: instance.getAttributes("highlight").color as string | undefined,
    }),
  })

  const activeMarks = useMemo(() => (state.marks ? (state.marks.split(" ") as MarkName[]) : []), [state.marks])

  if (state.empty) {
    return state.href ? <LinkToolbar editor={editor} href={state.href} /> : null
  }

  return (
    <Toolbar>
      <TurnIntoMenu editor={editor} activeId={state.blockTypeId} />
      <ToolbarSeparator />
      <MarkToggleGroup editor={editor} active={activeMarks} />
      <ToolbarSeparator />
      <LinkPopover editor={editor} active={state.link} registerShortcut />
      <ColorPopover editor={editor} textColor={state.textColor} highlightColor={state.highlightColor} />
    </Toolbar>
  )
}

/** The formatting toolbar shown above selected text. */
export function NotraBubbleMenu({ editor }: { editor: Editor }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const portal = useNotraPortal()
  const [pluginKey] = useState(() => new PluginKey("notraBubbleMenu"))

  useHideMenuOnFocusLeave(editor, menuRef, pluginKey)

  // Popovers opened from the bubble menu are rendered inside of it, so that
  // focusing them does not hide the menu.
  const portalValue = useMemo(() => ({ ...portal, container: menuRef }), [portal])

  return (
    <BubbleMenu
      ref={menuRef}
      editor={editor}
      pluginKey={pluginKey}
      updateDelay={100}
      shouldShow={shouldShowBubbleMenu}
      options={BUBBLE_MENU_OPTIONS}
      className="notra-bubble-menu nt:z-(--notra-z-index)"
    >
      <NotraPortalContext value={portalValue}>
        <BubbleMenuToolbar editor={editor} />
      </NotraPortalContext>
    </BubbleMenu>
  )
}
