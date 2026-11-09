import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "cn"
import { CheckIcon, ChevronRightIcon } from "lucide-react"
import type * as React from "react"

import { useNotraPortal } from "#lib/portal.tsx"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "anchor">) {
  const portal = useNotraPortal()

  return (
    <MenuPrimitive.Portal container={portal.container}>
      <MenuPrimitive.Positioner
        className={cn("nt:isolate nt:z-(--notra-z-index) nt:outline-none", portal.className)}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "nt:z-50 nt:max-h-(--available-height) nt:w-(--anchor-width) nt:min-w-32 nt:origin-(--transform-origin) nt:overflow-x-hidden nt:overflow-y-auto nt:rounded-lg nt:bg-popover nt:p-1 nt:text-popover-foreground nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:duration-100 nt:outline-none nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=inline-end]:slide-in-from-left-2 nt:data-[side=inline-start]:slide-in-from-right-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2 nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:overflow-hidden nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "nt:px-1.5 nt:py-1 nt:text-xs nt:font-medium nt:text-muted-foreground nt:data-inset:pl-7",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "nt:group/dropdown-menu-item nt:relative nt:flex nt:cursor-default nt:items-center nt:gap-1.5 nt:rounded-md nt:px-1.5 nt:py-1 nt:text-sm nt:outline-hidden nt:select-none nt:focus:bg-accent nt:focus:text-accent-foreground nt:not-data-[variant=destructive]:focus:**:text-accent-foreground nt:data-inset:pl-7 nt:data-[variant=destructive]:text-destructive nt:data-[variant=destructive]:focus:bg-destructive/10 nt:data-[variant=destructive]:focus:text-destructive nt:dark:data-[variant=destructive]:focus:bg-destructive/20 nt:data-disabled:pointer-events-none nt:data-disabled:opacity-50 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4 nt:data-[variant=destructive]:*:[svg]:text-destructive",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "nt:flex nt:cursor-default nt:items-center nt:gap-1.5 nt:rounded-md nt:px-1.5 nt:py-1 nt:text-sm nt:outline-hidden nt:select-none nt:focus:bg-accent nt:focus:text-accent-foreground nt:not-data-[variant=destructive]:focus:**:text-accent-foreground nt:data-inset:pl-7 nt:data-popup-open:bg-accent nt:data-popup-open:text-accent-foreground nt:data-open:bg-accent nt:data-open:text-accent-foreground nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="nt:ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "nt:w-auto nt:min-w-[96px] nt:rounded-lg nt:bg-popover nt:p-1 nt:text-popover-foreground nt:shadow-lg nt:ring-1 nt:ring-foreground/10 nt:duration-100 nt:data-[side=bottom]:slide-in-from-top-2 nt:data-[side=left]:slide-in-from-right-2 nt:data-[side=right]:slide-in-from-left-2 nt:data-[side=top]:slide-in-from-bottom-2 nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95",
        className,
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "nt:relative nt:flex nt:cursor-default nt:items-center nt:gap-1.5 nt:rounded-md nt:py-1 nt:pr-8 nt:pl-1.5 nt:text-sm nt:outline-hidden nt:select-none nt:focus:bg-accent nt:focus:text-accent-foreground nt:focus:**:text-accent-foreground nt:data-inset:pl-7 nt:data-disabled:pointer-events-none nt:data-disabled:opacity-50 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className="nt:pointer-events-none nt:absolute nt:right-2 nt:flex nt:items-center nt:justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "nt:relative nt:flex nt:cursor-default nt:items-center nt:gap-1.5 nt:rounded-md nt:py-1 nt:pr-8 nt:pl-1.5 nt:text-sm nt:outline-hidden nt:select-none nt:focus:bg-accent nt:focus:text-accent-foreground nt:focus:**:text-accent-foreground nt:data-inset:pl-7 nt:data-disabled:pointer-events-none nt:data-disabled:opacity-50 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4",
        className,
      )}
      {...props}
    >
      <span
        className="nt:pointer-events-none nt:absolute nt:right-2 nt:flex nt:items-center nt:justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("nt:-mx-1 nt:my-1 nt:h-px nt:bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "nt:ml-auto nt:text-xs nt:tracking-widest nt:text-muted-foreground nt:group-focus/dropdown-menu-item:text-accent-foreground",
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
