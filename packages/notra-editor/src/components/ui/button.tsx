import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	'nt:inline-flex nt:items-center nt:justify-center nt:gap-2 nt:whitespace-nowrap nt:rounded-md nt:text-sm nt:font-medium nt:transition-colors focus-visible:nt:outline-none focus-visible:nt:ring-1 focus-visible:nt:ring-ring disabled:nt:pointer-events-none disabled:nt:opacity-50 [&_svg]:nt:pointer-events-none [&_svg]:nt:size-4 [&_svg]:nt:shrink-0',
	{
		variants: {
			variant: {
				default:
					'nt:bg-primary nt:text-primary-foreground nt:shadow hover:nt:bg-primary/90',
				destructive:
					'nt:bg-destructive nt:text-destructive-foreground nt:shadow-sm hover:nt:bg-destructive/90',
				outline:
					'nt:border nt:border-input nt:bg-background nt:shadow-sm hover:nt:bg-accent hover:nt:text-accent-foreground',
				secondary:
					'nt:bg-secondary nt:text-secondary-foreground nt:shadow-sm hover:nt:bg-secondary/80',
				ghost: 'hover:nt:bg-accent hover:nt:text-accent-foreground',
				link: 'nt:text-primary nt:underline-offset-4 hover:nt:underline',
			},
			size: {
				default: 'nt:h-9 nt:px-4 nt:py-2',
				sm: 'nt:h-8 nt:rounded-md nt:px-3 nt:text-xs',
				lg: 'nt:h-10 nt:rounded-md nt:px-8',
				icon: 'nt:h-9 nt:w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);

Button.displayName = 'Button';

export { Button, buttonVariants };
