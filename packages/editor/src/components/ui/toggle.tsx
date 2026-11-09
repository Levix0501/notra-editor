import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const toggleVariants = cva(
  "nt:group/toggle nt:inline-flex nt:items-center nt:justify-center nt:gap-1 nt:rounded-lg nt:text-sm nt:font-medium nt:whitespace-nowrap nt:transition-all nt:outline-none nt:hover:bg-muted nt:hover:text-foreground nt:focus-visible:border-ring nt:focus-visible:ring-[3px] nt:focus-visible:ring-ring/50 nt:disabled:pointer-events-none nt:disabled:opacity-50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-destructive/20 nt:aria-pressed:bg-muted nt:data-[state=on]:bg-muted nt:dark:aria-invalid:ring-destructive/40 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "nt:bg-transparent",
        outline: "nt:border nt:border-input nt:bg-transparent nt:hover:bg-muted",
      },
      size: {
        default: "nt:h-8 nt:min-w-8 nt:px-2.5 nt:has-data-[icon=inline-end]:pr-2 nt:has-data-[icon=inline-start]:pl-2",
        sm: "nt:h-7 nt:min-w-7 nt:rounded-[min(--theme(--radius-md),12px)] nt:px-2.5 nt:text-[0.8rem] nt:has-data-[icon=inline-end]:pr-1.5 nt:has-data-[icon=inline-start]:pl-1.5 nt:[&_svg:not([class*=size-])]:size-3.5",
        lg: "nt:h-9 nt:min-w-9 nt:px-2.5 nt:has-data-[icon=inline-end]:pr-2 nt:has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive data-slot="toggle" className={cn(toggleVariants({ variant, size, className }))} {...props} />
}

export { Toggle, toggleVariants }
