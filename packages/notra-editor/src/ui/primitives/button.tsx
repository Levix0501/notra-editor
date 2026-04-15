import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	"nta:inline-flex nta:items-center nta:justify-center nta:gap-2 nta:whitespace-nowrap nta:rounded-md nta:text-sm nta:font-medium nta:transition-all disabled:nta:pointer-events-none disabled:nta:opacity-50 [&_svg]:nta:pointer-events-none [&_svg:not([class*='size-'])]:nta:size-4 nta:shrink-0 [&_svg]:nta:shrink-0 nta:outline-none focus-visible:nta:border-ring focus-visible:nta:ring-ring/50 focus-visible:nta:ring-[3px] aria-invalid:nta:ring-destructive/20 dark:aria-invalid:nta:ring-destructive/40 aria-invalid:nta:border-destructive",
	{
		variants: {
			variant: {
				default: 'nta:bg-primary nta:text-primary-foreground hover:nta:bg-primary/90',
				destructive:
					'nta:bg-destructive nta:text-white hover:nta:bg-destructive/90 focus-visible:nta:ring-destructive/20 dark:focus-visible:nta:ring-destructive/40 dark:nta:bg-destructive/60',
				outline:
					'nta:border nta:bg-background nta:shadow-xs hover:nta:bg-accent hover:nta:text-accent-foreground dark:nta:bg-input/30 dark:nta:border-input dark:hover:nta:bg-input/50',
				secondary:
					'nta:bg-secondary nta:text-secondary-foreground hover:nta:bg-secondary/80',
				ghost:
					'hover:nta:bg-accent hover:nta:text-accent-foreground dark:hover:nta:bg-accent/50',
				link: 'nta:text-primary nta:underline-offset-4 hover:nta:underline'
			},
			size: {
				default: 'nta:h-9 nta:px-4 nta:py-2 has-[>svg]:nta:px-3',
				xs: 'nta:h-7 nta:gap-0 nta:px-1.5',
				sm: 'nta:h-8 nta:rounded-md nta:gap-1.5 nta:px-3 has-[>svg]:nta:px-2.5',
				lg: 'nta:h-10 nta:rounded-md nta:px-6 has-[>svg]:nta:px-4',
				icon: 'nta:size-9',
				'icon-xs': 'nta:size-7',
				'icon-sm': 'nta:size-8',
				'icon-lg': 'nta:size-10'
			},
			isActive: {
				true: 'nta:bg-accent nta:text-accent-foreground dark:nta:bg-accent/50'
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
	isActive = false,
	...props
}: Readonly<React.ComponentProps<'button'>> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : 'button';

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className, isActive }))}
			data-size={size}
			data-slot="button"
			data-variant={variant}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
