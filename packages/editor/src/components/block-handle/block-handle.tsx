import type { Editor } from "@tiptap/core"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"
import { cn } from "cn"
import { CopyIcon, GripVerticalIcon, PlusIcon, Repeat2Icon, Trash2Icon } from "lucide-react"
import { type DragEvent, type MouseEvent, type RefObject, useEffect, useRef, useState } from "react"

import { blockTypes, convertBlock } from "#blocks/block-types.ts"
import { useDictionary } from "#components/dictionary-context.tsx"
import { ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "#components/ui/dropdown-menu.tsx"
import { altKeyLabel } from "#lib/platform.ts"
import { findBlockAtY, getHandlePosition, type HandlePosition, type HandleTarget, isListItem } from "./find-block"

function canConvert(target: HandleTarget): boolean {
  return target.node.isTextblock || isListItem(target.node) || target.node.type.name === "blockquote"
}

interface BlockHandleProps {
  editor: Editor
  /** The positioned root element of the editor (contains the content and the gutter). */
  rootRef: RefObject<HTMLDivElement | null>
}

/**
 * The handle shown next to the hovered block: `+` inserts a new block, the
 * grip moves the block by drag and drop or opens the block menu.
 */
export function BlockHandle({ editor, rootRef }: BlockHandleProps) {
  const dictionary = useDictionary()
  const [target, setTarget] = useState<HandleTarget | null>(null)
  const [position, setPosition] = useState<HandlePosition | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const gripRef = useRef<HTMLButtonElement>(null)
  // While the menu is open or a block is dragged, the handle stays in place.
  const frozenRef = useRef(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let frame = 0

    const onMouseMove = (event: globalThis.MouseEvent) => {
      if (frozenRef.current) return
      const { clientY } = event
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (editor.isDestroyed || !editor.isEditable) {
          setTarget(null)
          return
        }
        const next = findBlockAtY(editor.view, clientY)
        setTarget(next)
        setPosition(next ? getHandlePosition(next.dom, editor.view.dom, root) : null)
      })
    }

    const hide = () => {
      if (frozenRef.current) return
      cancelAnimationFrame(frame)
      setTarget(null)
    }

    const view = editor.view
    root.addEventListener("mousemove", onMouseMove)
    root.addEventListener("mouseleave", hide)
    view.dom.addEventListener("keydown", hide)

    return () => {
      cancelAnimationFrame(frame)
      root.removeEventListener("mousemove", onMouseMove)
      root.removeEventListener("mouseleave", hide)
      view.dom.removeEventListener("keydown", hide)
    }
  }, [editor, rootRef])

  const handleMenuOpenChange = (open: boolean) => {
    frozenRef.current = open
    setMenuOpen(open)
  }

  const insertBlock = (event: MouseEvent) => {
    if (!target) return
    const { node, pos } = target

    if (node.type.name === "paragraph" && node.content.size === 0) {
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1)
        .insertContent("/")
        .run()
      return
    }

    const insertPos = event.altKey ? pos : pos + node.nodeSize
    editor.chain().focus().insertContentAt(insertPos, { type: "paragraph" }).insertContent("/").run()
  }

  const startDrag = (event: DragEvent<HTMLElement>) => {
    if (!target) return
    const { view } = editor
    frozenRef.current = true

    const selection = NodeSelection.create(view.state.doc, target.pos)
    view.dispatch(view.state.tr.setSelection(selection))

    const slice = selection.content()
    const { dom, text } = view.serializeForClipboard(slice)
    event.dataTransfer.clearData()
    event.dataTransfer.setData("text/html", dom.innerHTML)
    event.dataTransfer.setData("text/plain", text)
    event.dataTransfer.effectAllowed = "copyMove"
    event.dataTransfer.setDragImage(target.dom, 0, 0)

    // Let ProseMirror's drop handling move the selected block.
    view.dragging = { slice, move: true }
  }

  const endDrag = () => {
    frozenRef.current = false
    setTarget(null)
  }

  const selectInside = (block: HandleTarget) => {
    const selection = TextSelection.near(editor.state.doc.resolve(block.pos + 1))
    editor.chain().focus().setTextSelection(selection.from).run()
  }

  const duplicateBlock = () => {
    if (!target) return
    editor
      .chain()
      .focus()
      .insertContentAt(target.pos + target.node.nodeSize, target.node.toJSON())
      .run()
  }

  const deleteBlock = () => {
    if (!target) return
    editor
      .chain()
      .focus()
      .deleteRange({ from: target.pos, to: target.pos + target.node.nodeSize })
      .run()
  }

  const visible = (target !== null && position !== null) || menuOpen

  return (
    <div
      data-notra-block-handle=""
      className={cn(
        "notra-block-handle nt:absolute nt:top-0 nt:left-0 nt:z-10 nt:flex nt:items-center nt:gap-0.5 nt:transition-opacity nt:duration-150",
        visible ? "nt:opacity-100" : "nt:pointer-events-none nt:opacity-0",
      )}
      style={position ? { transform: `translate(calc(${position.left}px - 100%), ${position.top}px)` } : undefined}
    >
      <ToolbarTooltip
        side="bottom"
        label={
          <span className="nt:flex nt:flex-col">
            <span>{dictionary.blockMenu.add}</span>
            <span className="nt:opacity-70">{dictionary.blockMenu.addAbove.replace("{key}", altKeyLabel)}</span>
          </span>
        }
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={dictionary.blockMenu.add}
            className="nt:text-muted-foreground"
            onClick={insertBlock}
          >
            <PlusIcon className="nt:size-4" />
          </Button>
        }
      />

      <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange} modal={false}>
        <ToolbarTooltip
          side="bottom"
          label={
            <span className="nt:flex nt:flex-col">
              <span>{dictionary.blockMenu.drag}</span>
              <span className="nt:opacity-70">{dictionary.blockMenu.open}</span>
            </span>
          }
          render={
            <Button
              ref={gripRef}
              variant="ghost"
              size="icon-xs"
              draggable
              aria-label={dictionary.blockMenu.open}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="nt:cursor-grab nt:text-muted-foreground nt:active:cursor-grabbing"
              onClick={() => handleMenuOpenChange(true)}
              onDragStart={startDrag}
              onDragEnd={endDrag}
            >
              <GripVerticalIcon className="nt:size-4" />
            </Button>
          }
        />
        <DropdownMenuContent anchor={gripRef} side="left" align="start" sideOffset={6} className="nt:w-52">
          {target && canConvert(target) ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Repeat2Icon />
                  {dictionary.blockMenu.turnInto}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="nt:w-52">
                  {blockTypes.map((blockType) => {
                    const Icon = blockType.icon
                    return (
                      <DropdownMenuItem
                        key={blockType.id}
                        onClick={() => {
                          selectInside(target)
                          convertBlock(editor, blockType)
                        }}
                      >
                        <Icon />
                        {dictionary.blocks[blockType.id]}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={duplicateBlock}>
            <CopyIcon />
            {dictionary.blockMenu.duplicate}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={deleteBlock}>
            <Trash2Icon />
            {dictionary.blockMenu.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
