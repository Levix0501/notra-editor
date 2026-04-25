import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	'nt:group/button nt:inline-flex nt:shrink-0 nt:items-center nt:justify-center nt:rounded-lg nt:border nt:border-transparent nt:bg-clip-padding nt:text-sm nt:font-medium nt:whitespace-nowrap nt:transition-all nt:outline-none nt:select-none nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50 nt:active:not-aria-[haspopup]:translate-y-px nt:disabled:pointer-events-none nt:disabled:opacity-50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:dark:aria-invalid:border-destructive/50 nt:dark:aria-invalid:ring-destructive/40 nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4',
	{
		variants: {
			variant: {
				default:
					'nt:bg-primary nt:text-primary-foreground nt:[a]:hover:bg-primary/80',
				outline:
					'nt:border-border nt:bg-background nt:hover:bg-muted nt:hover:text-foreground nt:aria-expanded:bg-muted nt:aria-expanded:text-foreground nt:dark:border-input nt:dark:bg-input/30 nt:dark:hover:bg-input/50',
				secondary:
					'nt:bg-secondary nt:text-secondary-foreground nt:hover:bg-secondary/80 nt:aria-expanded:bg-secondary nt:aria-expanded:text-secondary-foreground',
				ghost:
					'nt:hover:bg-muted nt:hover:text-foreground nt:aria-expanded:bg-muted nt:aria-expanded:text-foreground nt:dark:hover:bg-muted/50',
				destructive:
					'nt:bg-destructive/10 nt:text-destructive nt:hover:bg-destructive/20 nt:focus-visible:border-destructive/40 nt:focus-visible:ring-destructive/20 nt:dark:bg-destructive/20 nt:dark:hover:bg-destructive/30 nt:dark:focus-visible:ring-destructive/40',
				link: 'nt:text-primary nt:underline-offset-4 nt:hover:underline'
			},
			size: {
				default:
					'nt:h-8 nt:gap-1.5 nt:px-2.5 nt:has-data-[icon=inline-end]:pr-2 nt:has-data-[icon=inline-start]:pl-2',
				xs: 'nt:h-6 nt:gap-1 nt:rounded-[min(var(--radius-md),10px)] nt:px-2 nt:text-xs nt:in-data-[slot=button-group]:rounded-lg nt:has-data-[icon=inline-end]:pr-1.5 nt:has-data-[icon=inline-start]:pl-1.5 nt:[&_svg:not([class*=size-])]:size-3',
				sm: 'nt:h-7 nt:gap-1 nt:rounded-[min(var(--radius-md),12px)] nt:px-2.5 nt:text-[0.8rem] nt:in-data-[slot=button-group]:rounded-lg nt:has-data-[icon=inline-end]:pr-1.5 nt:has-data-[icon=inline-start]:pl-1.5 nt:[&_svg:not([class*=size-])]:size-3.5',
				lg: 'nt:h-9 nt:gap-1.5 nt:px-2.5 nt:has-data-[icon=inline-end]:pr-2 nt:has-data-[icon=inline-start]:pl-2',
				icon: 'nt:size-8',
				'icon-xs':
					'nt:size-6 nt:rounded-[min(var(--radius-md),10px)] nt:in-data-[slot=button-group]:rounded-lg nt:[&_svg:not([class*=size-])]:size-3',
				'icon-sm':
					'nt:size-7 nt:rounded-[min(var(--radius-md),12px)] nt:in-data-[slot=button-group]:rounded-lg',
				'icon-lg': 'nt:size-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : 'button';

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			data-size={size}
			data-slot="button"
			data-variant={variant}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
