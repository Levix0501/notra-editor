import { cn } from "cn"
import type * as React from "react"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "nt:flex nt:items-center nt:gap-2 nt:text-sm nt:leading-none nt:font-medium nt:select-none nt:group-data-[disabled=true]:pointer-events-none nt:group-data-[disabled=true]:opacity-50 nt:peer-disabled:cursor-not-allowed nt:peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
