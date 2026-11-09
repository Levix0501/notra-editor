import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import type { VariantProps } from "class-variance-authority"
import { cn } from "cn"
import * as React from "react"

import { toggleVariants } from "#components/ui/toggle.tsx"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "nt:group/toggle-group nt:flex nt:w-fit nt:flex-row nt:items-center nt:gap-[--spacing(var(--gap))] nt:rounded-lg nt:data-[size=sm]:rounded-[min(--theme(--radius-md),10px)] nt:data-vertical:flex-col nt:data-vertical:items-stretch",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "nt:shrink-0 nt:group-data-[spacing=0]/toggle-group:rounded-none nt:group-data-[spacing=0]/toggle-group:px-2 nt:focus:z-10 nt:focus-visible:z-10 nt:group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 nt:group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 nt:group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg nt:group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg nt:group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg nt:group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg nt:group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 nt:group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 nt:group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l nt:group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
