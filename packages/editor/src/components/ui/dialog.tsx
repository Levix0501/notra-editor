import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import { XIcon } from "lucide-react"
import type * as React from "react"
import { Button } from "#components/ui/button.tsx"
import { useNotraPortal } from "#lib/portal.tsx"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  const portal = useNotraPortal()

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "nt:fixed nt:inset-0 nt:isolate nt:z-(--notra-z-index) nt:bg-black/10 nt:duration-100 nt:supports-backdrop-filter:backdrop-blur-xs nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-closed:animate-out nt:data-closed:fade-out-0",
        portal.className,
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const portal = useNotraPortal()

  return (
    <DialogPortal container={portal.container}>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          portal.className,
          "nt:fixed nt:top-1/2 nt:left-1/2 nt:z-(--notra-z-index) nt:grid nt:w-full nt:max-w-[calc(100%-2rem)] nt:-translate-x-1/2 nt:-translate-y-1/2 nt:gap-4 nt:rounded-xl nt:bg-popover nt:p-4 nt:text-sm nt:text-popover-foreground nt:ring-1 nt:ring-foreground/10 nt:duration-100 nt:outline-none nt:sm:max-w-sm nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button variant="ghost" className="nt:absolute nt:top-2 nt:right-2" size="icon-sm" />}
          >
            <XIcon />
            <span className="nt:sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("nt:flex nt:flex-col nt:gap-2", className)} {...props} />
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "nt:-mx-4 nt:-mb-4 nt:flex nt:flex-col-reverse nt:gap-2 nt:rounded-b-xl nt:border-t nt:bg-muted/50 nt:p-4 nt:sm:flex-row nt:sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && <DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("nt:text-base nt:leading-none nt:font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "nt:text-sm nt:text-muted-foreground nt:*:[a]:underline nt:*:[a]:underline-offset-3 nt:*:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
