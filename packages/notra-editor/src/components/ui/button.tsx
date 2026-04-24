import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "nt:inline-flex nt:shrink-0 nt:items-center nt:justify-center nt:gap-2 nt:rounded-md nt:text-sm nt:font-medium nt:whitespace-nowrap nt:transition-all nt:outline-none nt:focus-visible:border-ring nt:focus-visible:ring-[3px] nt:focus-visible:ring-ring/50 nt:disabled:pointer-events-none nt:disabled:opacity-50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-destructive/20 nt:dark:aria-invalid:ring-destructive/40 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "nt:bg-primary nt:text-primary-foreground nt:hover:bg-primary/90",
        destructive:
          "nt:bg-destructive nt:text-white nt:hover:bg-destructive/90 nt:focus-visible:ring-destructive/20 nt:dark:bg-destructive/60 nt:dark:focus-visible:ring-destructive/40",
        outline:
          "nt:border nt:bg-background nt:shadow-xs nt:hover:bg-accent nt:hover:text-accent-foreground nt:dark:border-input nt:dark:bg-input/30 nt:dark:hover:bg-input/50",
        secondary:
          "nt:bg-secondary nt:text-secondary-foreground nt:hover:bg-secondary/80",
        ghost:
          "nt:hover:bg-accent nt:hover:text-accent-foreground nt:dark:hover:bg-accent/50",
        link: "nt:text-primary nt:underline-offset-4 nt:hover:underline",
      },
      size: {
        default: "nt:h-9 nt:px-4 nt:py-2 nt:has-[>svg]:px-3",
        xs: "nt:h-6 nt:gap-1 nt:rounded-md nt:px-2 nt:text-xs nt:has-[>svg]:px-1.5 nt:[&_svg:not([class*=size-])]:size-3",
        sm: "nt:h-8 nt:gap-1.5 nt:rounded-md nt:px-3 nt:has-[>svg]:px-2.5",
        lg: "nt:h-10 nt:rounded-md nt:px-6 nt:has-[>svg]:px-4",
        icon: "nt:size-9",
        "icon-xs": "nt:size-6 nt:rounded-md nt:[&_svg:not([class*=size-])]:size-3",
        "icon-sm": "nt:size-8",
        "icon-lg": "nt:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
