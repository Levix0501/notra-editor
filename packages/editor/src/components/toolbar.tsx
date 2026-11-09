import { cn } from "cn"
import type { ComponentProps, ReactElement, ReactNode } from "react"

import { Kbd } from "#components/ui/kbd.tsx"
import { Separator } from "#components/ui/separator.tsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "#components/ui/tooltip.tsx"
import { formatShortcut } from "#lib/platform.ts"

/** Keeps the editor focused (and its selection visible) when a button is clicked. */
export function preventFocusLoss(event: { preventDefault: () => void }): void {
  event.preventDefault()
}

/** A floating toolbar, styled like the shadcn/ui popover surfaces (menus and popovers). */
export function Toolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      onMouseDown={preventFocusLoss}
      className={cn(
        "nt:flex nt:items-center nt:gap-0.5 nt:rounded-lg nt:bg-popover nt:p-1 nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10",
        className,
      )}
      {...props}
    />
  )
}

export function ToolbarSeparator() {
  return <Separator orientation="vertical" className="nt:mx-0.5 nt:h-4 nt:data-vertical:self-center" />
}

interface ToolbarTooltipProps {
  label: ReactNode
  shortcut?: readonly string[]
  /** The trigger element. Its props are merged with the tooltip trigger props. */
  render: ReactElement
  side?: "top" | "bottom" | "left" | "right"
}

/** Wraps a trigger element with a tooltip that shows a label and an optional shortcut. */
export function ToolbarTooltip({ label, shortcut, render, side = "top" }: ToolbarTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={render} />
      <TooltipContent side={side} sideOffset={6}>
        {label}
        {shortcut ? <Kbd>{formatShortcut(shortcut)}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}
