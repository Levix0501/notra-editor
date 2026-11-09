import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"
import type * as React from "react"

import { useNotraPortal } from "#lib/portal.tsx"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "anchor">) {
  const portal = useNotraPortal()

  return (
    <PopoverPrimitive.Portal container={portal.container}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        className={cn("nt:isolate nt:z-(--notra-z-index)", portal.className)}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "nt:z-50 nt:flex nt:w-72 nt:origin-(--transform-origin) nt:flex-col nt:gap-2.5 nt:rounded-lg nt:bg-popover nt:p-2.5 nt:text-sm nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:outline-hidden nt:duration-100 nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=inline-end]:slide-in-from-left-2 nt:data-[side=inline-start]:slide-in-from-right-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2 nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="popover-header" className={cn("nt:flex nt:flex-col nt:gap-0.5 nt:text-sm", className)} {...props} />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={cn("nt:font-medium", className)} {...props} />
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("nt:text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger }
