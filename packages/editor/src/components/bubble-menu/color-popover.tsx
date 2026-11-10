import type { Editor } from "@tiptap/core"
import { BaselineIcon, ChevronDownIcon } from "lucide-react"
import { type ReactNode, useState } from "react"

import { useDictionary } from "#components/dictionary-context.tsx"
import { ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "#components/ui/popover.tsx"
import { ToggleGroup, ToggleGroupItem } from "#components/ui/toggle-group.tsx"
import { COLOR_NAMES, type ColorName, HIGHLIGHT_COLORS, TEXT_COLORS } from "#lib/colors.ts"

type ColorOption = ColorName | "default"

const OPTIONS: readonly ColorOption[] = ["default", ...COLOR_NAMES]

function isColorName(value: unknown): value is ColorName {
  return COLOR_NAMES.includes(value as ColorName)
}

function findColorName(palette: Record<ColorName, string>, color: string | undefined): ColorOption | undefined {
  if (!color) return "default"
  return COLOR_NAMES.find((name) => palette[name] === color)
}

interface ColorGroupProps {
  title: string
  palette: Record<ColorName, string>
  value: string | undefined
  onChange: (color: string | undefined) => void
  renderSwatch: (color: string | undefined) => ReactNode
}

function ColorGroup({ title, palette, value, onChange, renderSwatch }: ColorGroupProps) {
  const dictionary = useDictionary()
  const selected = findColorName(palette, value)

  return (
    <div className="nt:flex nt:flex-col nt:gap-1.5">
      <span className="nt:text-xs nt:font-medium nt:text-muted-foreground">{title}</span>
      <ToggleGroup
        size="sm"
        spacing={1}
        aria-label={title}
        value={selected ? [selected] : []}
        onValueChange={([name]) => {
          onChange(isColorName(name) ? palette[name] : undefined)
        }}
        className="nt:grid nt:grid-cols-9"
      >
        {OPTIONS.map((name) => (
          <ToolbarTooltip
            key={name}
            label={dictionary.colors[name]}
            render={
              <ToggleGroupItem value={name} aria-label={dictionary.colors[name]} className="nt:px-0">
                {renderSwatch(name === "default" ? undefined : palette[name])}
              </ToggleGroupItem>
            }
          />
        ))}
      </ToggleGroup>
    </div>
  )
}

interface ColorPopoverProps {
  editor: Editor
  textColor: string | undefined
  highlightColor: string | undefined
  /** Whether text colors can be applied (the `textColor` feature). */
  showTextColor: boolean
  /** Whether highlights can be applied (the `highlight` feature). */
  showHighlight: boolean
}

export function ColorPopover({ editor, textColor, highlightColor, showTextColor, showHighlight }: ColorPopoverProps) {
  const dictionary = useDictionary()
  const [open, setOpen] = useState(false)

  const applyTextColor = (color: string | undefined) => {
    const chain = editor.chain().focus()
    ;(color ? chain.setColor(color) : chain.unsetColor()).run()
    setOpen(false)
  }

  const applyHighlightColor = (color: string | undefined) => {
    const chain = editor.chain().focus()
    ;(color ? chain.setHighlight({ color }) : chain.unsetHighlight()).run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ToolbarTooltip
        label={dictionary.bubbleMenu.color}
        render={
          <PopoverTrigger
            render={
              <Button variant="ghost" size="sm" aria-label={dictionary.bubbleMenu.color}>
                <BaselineIcon style={{ color: textColor, backgroundColor: highlightColor }} className="nt:rounded-sm" />
                <ChevronDownIcon className="nt:opacity-50" />
              </Button>
            }
          />
        }
      />
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        // Keyboard users get focus on the swatches; a click keeps the editor focused.
        initialFocus={(openType) => openType === "keyboard"}
        finalFocus={false}
        className="nt:w-auto nt:gap-3"
      >
        {showTextColor ? (
          <ColorGroup
            title={dictionary.colors.text}
            palette={TEXT_COLORS}
            value={textColor}
            onChange={applyTextColor}
            renderSwatch={(color) => <BaselineIcon style={{ color }} />}
          />
        ) : null}
        {showHighlight ? (
          <ColorGroup
            title={dictionary.colors.highlight}
            palette={HIGHLIGHT_COLORS}
            value={highlightColor}
            onChange={applyHighlightColor}
            renderSwatch={(color) => (
              <span
                className="nt:size-4 nt:rounded-sm nt:border nt:border-foreground/15"
                style={{ backgroundColor: color }}
              />
            )}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
