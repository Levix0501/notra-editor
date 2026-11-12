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
import { handleLinkClick } from "#extensions/link-click.ts"
import { isInTextCell } from "#extensions/table.ts"
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
  // No formatting in code blocks and source blocks.
  if (selection.$from.parent.type.spec.code || selection.$to.parent.type.spec.code) return false

  // A collapsed cursor inside a link shows the link toolbar. (`isActive` must
  // not be called with unknown names: it then matches any mark.)
  if (selection.empty) return editor.schema.marks.link !== undefined && editor.isActive("link")

  return state.doc.textBetween(from, to, " ").trim().length > 0
}

function MarkToggleGroup({ editor, marks, active }: { editor: Editor; marks: MarkDefinition[]; active: MarkName[] }) {
  const dictionary = useDictionary()

  return (
    <ToggleGroup multiple size="sm" spacing={0.5} value={active}>
      {marks.map((mark) => {
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
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => handleLinkClick(editor, href, event.nativeEvent)}
          />
        }
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
            render={
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => handleLinkClick(editor, href, event.nativeEvent)}
              />
            }
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

/** The formatting features of the editor, which depend on its extensions. */
function getCapabilities(editor: Editor) {
  const { marks } = editor.schema
  return {
    marks: MARKS.filter((mark) => marks[mark.name] !== undefined),
    link: marks.link !== undefined,
    textColor: editor.extensionManager.extensions.some((extension) => extension.name === "color"),
    highlight: marks.highlight !== undefined,
  }
}

function BubbleMenuToolbar({ editor }: { editor: Editor }) {
  const capabilities = useMemo(() => getCapabilities(editor), [editor])
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      empty: instance.state.selection.empty,
      blockTypeId: getActiveBlockType(instance)?.id,
      // Cells that only hold text cannot turn into other blocks.
      canTurnInto: !isInTextCell(instance.state.selection),
      marks: capabilities.marks
        .filter((mark) => instance.isActive(mark.name))
        .map((mark) => mark.name)
        .join(" "),
      link: capabilities.link && instance.isActive("link"),
      href: instance.getAttributes("link").href as string | undefined,
      textColor: instance.getAttributes("textStyle").color as string | undefined,
      highlightColor: instance.getAttributes("highlight").color as string | undefined,
    }),
  })

  const activeMarks = useMemo(() => (state.marks ? (state.marks.split(" ") as MarkName[]) : []), [state.marks])

  if (state.empty) {
    return state.href ? <LinkToolbar editor={editor} href={state.href} /> : null
  }

  const hasColors = capabilities.textColor || capabilities.highlight

  return (
    <Toolbar>
      {state.canTurnInto ? <TurnIntoMenu editor={editor} activeId={state.blockTypeId} /> : null}
      {capabilities.marks.length > 0 ? (
        <>
          {state.canTurnInto ? <ToolbarSeparator /> : null}
          <MarkToggleGroup editor={editor} marks={capabilities.marks} active={activeMarks} />
        </>
      ) : null}
      {(capabilities.link || hasColors) && (state.canTurnInto || capabilities.marks.length > 0) ? (
        <ToolbarSeparator />
      ) : null}
      {capabilities.link ? <LinkPopover editor={editor} active={state.link} registerShortcut /> : null}
      {hasColors ? (
        <ColorPopover
          editor={editor}
          textColor={state.textColor}
          highlightColor={state.highlightColor}
          showTextColor={capabilities.textColor}
          showHighlight={capabilities.highlight}
        />
      ) : null}
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
