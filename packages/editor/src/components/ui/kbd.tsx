import { cn } from "cn"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "nt:pointer-events-none nt:inline-flex nt:h-5 nt:w-fit nt:min-w-5 nt:items-center nt:justify-center nt:gap-1 nt:rounded-sm nt:bg-muted nt:px-1 nt:font-sans nt:text-xs nt:font-medium nt:text-muted-foreground nt:select-none nt:in-data-[slot=tooltip-content]:bg-background/20 nt:in-data-[slot=tooltip-content]:text-background nt:dark:in-data-[slot=tooltip-content]:bg-background/10 nt:[&_svg:not([class*=size-])]:size-3",
        className,
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <kbd data-slot="kbd-group" className={cn("nt:inline-flex nt:items-center nt:gap-1", className)} {...props} />
}

export { Kbd, KbdGroup }
