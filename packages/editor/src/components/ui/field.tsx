import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { useMemo } from "react"

import { Label } from "#components/ui/label.tsx"
import { Separator } from "#components/ui/separator.tsx"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "nt:flex nt:flex-col nt:gap-4 nt:has-[>[data-slot=checkbox-group]]:gap-3 nt:has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "nt:mb-1.5 nt:font-medium nt:data-[variant=label]:text-sm nt:data-[variant=legend]:text-base",
        className,
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "nt:group/field-group nt:@container/field-group nt:flex nt:w-full nt:flex-col nt:gap-5 nt:data-[slot=checkbox-group]:gap-3 nt:*:data-[slot=field-group]:gap-4",
        className,
      )}
      {...props}
    />
  )
}

const fieldVariants = cva("nt:group/field nt:flex nt:w-full nt:gap-2 nt:data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "nt:flex-col nt:*:w-full nt:[&>.sr-only]:w-auto",
      horizontal:
        "nt:flex-row nt:items-center nt:has-[>[data-slot=field-content]]:items-start nt:*:data-[slot=field-label]:flex-auto nt:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "nt:flex-col nt:*:w-full nt:@md/field-group:flex-row nt:@md/field-group:items-center nt:@md/field-group:*:w-auto nt:@md/field-group:has-[>[data-slot=field-content]]:items-start nt:@md/field-group:*:data-[slot=field-label]:flex-auto nt:[&>.sr-only]:w-auto nt:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("nt:group/field-content nt:flex nt:flex-1 nt:flex-col nt:gap-0.5 nt:leading-snug", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "nt:group/field-label nt:peer/field-label nt:flex nt:w-fit nt:gap-2 nt:leading-snug nt:group-data-[disabled=true]/field:opacity-50 nt:has-data-checked:border-primary/30 nt:has-data-checked:bg-primary/5 nt:has-[>[data-slot=field]]:rounded-lg nt:has-[>[data-slot=field]]:border nt:has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 nt:has-[>[data-slot=field]]:has-[:focus-visible]:border-ring nt:has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 nt:has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 nt:*:data-[slot=field]:p-2.5 nt:dark:has-data-checked:border-primary/20 nt:dark:has-data-checked:bg-primary/10",
        "nt:has-[>[data-slot=field]]:w-full nt:has-[>[data-slot=field]]:flex-col",
        className,
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "nt:flex nt:w-fit nt:items-center nt:gap-2 nt:text-sm nt:font-medium nt:group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "nt:text-left nt:text-sm nt:leading-normal nt:font-normal nt:text-muted-foreground nt:group-has-data-horizontal/field:text-balance nt:[[data-variant=legend]+&]:-mt-1.5",
        "nt:last:mt-0 nt:nth-last-2:-mt-1",
        "nt:[&>a]:underline nt:[&>a]:underline-offset-4 nt:[&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "nt:relative nt:-my-2 nt:h-5 nt:text-sm nt:group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="nt:absolute nt:inset-0 nt:top-1/2" />
      {children && (
        <span
          className="nt:relative nt:mx-auto nt:block nt:w-fit nt:bg-background nt:px-2 nt:text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="nt:ml-4 nt:flex nt:list-disc nt:flex-col nt:gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("nt:text-sm nt:font-normal nt:text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
