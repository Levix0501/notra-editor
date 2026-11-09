import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "cn"

import { useNotraPortal } from "#lib/portal.tsx"

function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const portal = useNotraPortal()

  return (
    <TooltipPrimitive.Portal container={portal.container}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={cn("nt:isolate nt:z-(--notra-z-index)", portal.className)}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "nt:z-50 nt:inline-flex nt:w-fit nt:max-w-xs nt:origin-(--transform-origin) nt:items-center nt:gap-1.5 nt:rounded-md nt:bg-foreground nt:px-3 nt:py-1.5 nt:text-xs nt:text-background nt:has-data-[slot=kbd]:pr-1.5 nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=inline-end]:slide-in-from-left-2 nt:data-[side=inline-start]:slide-in-from-right-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2 nt:**:data-[slot=kbd]:relative nt:**:data-[slot=kbd]:isolate nt:**:data-[slot=kbd]:z-50 nt:**:data-[slot=kbd]:rounded-sm nt:data-[state=delayed-open]:animate-in nt:data-[state=delayed-open]:fade-in-0 nt:data-[state=delayed-open]:zoom-in-95 nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="nt:z-50 nt:size-2.5 nt:translate-y-[calc(-50%-2px)] nt:rotate-45 nt:rounded-[2px] nt:bg-foreground nt:fill-foreground nt:data-[side=bottom]:top-1 nt:data-[side=inline-end]:top-1/2! nt:data-[side=inline-end]:-left-1 nt:data-[side=inline-end]:-translate-y-1/2 nt:data-[side=inline-start]:top-1/2! nt:data-[side=inline-start]:-right-1 nt:data-[side=inline-start]:-translate-y-1/2 nt:data-[side=left]:top-1/2! nt:data-[side=left]:-right-1 nt:data-[side=left]:-translate-y-1/2 nt:data-[side=right]:top-1/2! nt:data-[side=right]:-left-1 nt:data-[side=right]:-translate-y-1/2 nt:data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
