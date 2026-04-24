import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	'nt:inline-flex nt:items-center nt:justify-center nt:gap-2 nt:whitespace-nowrap nt:rounded-md nt:text-sm nt:font-medium nt:transition-colors nt:focus-visible:outline-none nt:focus-visible:ring-1 nt:focus-visible:ring-ring nt:disabled:pointer-events-none nt:disabled:opacity-50 nt:[&_svg]:pointer-events-none nt:[&_svg]:size-4 nt:[&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default:
					'nt:bg-primary nt:text-primary-foreground nt:shadow nt:hover:bg-primary/90',
				destructive:
					'nt:bg-destructive nt:text-destructive-foreground nt:shadow-sm nt:hover:bg-destructive/90',
				outline:
					'nt:border nt:border-input nt:bg-background nt:shadow-sm nt:hover:bg-accent nt:hover:text-accent-foreground',
				secondary:
					'nt:bg-secondary nt:text-secondary-foreground nt:shadow-sm nt:hover:bg-secondary/80',
				ghost: 'nt:hover:bg-accent nt:hover:text-accent-foreground',
				link: 'nt:text-primary nt:underline-offset-4 nt:hover:underline'
			},
			size: {
				default: 'nt:h-9 nt:px-4 nt:py-2',
				sm: 'nt:h-8 nt:rounded-md nt:px-3 nt:text-xs',
				lg: 'nt:h-10 nt:rounded-md nt:px-8',
				icon: 'nt:h-9 nt:w-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

export interface ButtonProps
	extends
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp
				ref={ref}
				className={cn(buttonVariants({ variant, size, className }))}
				{...props}
			/>
		);
	}
);

Button.displayName = 'Button';

export { Button, buttonVariants };
