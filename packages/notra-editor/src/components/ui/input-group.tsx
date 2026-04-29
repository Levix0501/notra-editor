'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="input-group"
			role="group"
			className={cn(
				'nt:group/input-group nt:relative nt:flex nt:h-8 nt:w-full nt:min-w-0 nt:items-center nt:rounded-lg nt:border nt:border-input nt:transition-colors nt:outline-none nt:in-data-[slot=combobox-content]:focus-within:border-inherit nt:in-data-[slot=combobox-content]:focus-within:ring-0 nt:has-disabled:bg-input/50 nt:has-disabled:opacity-50 nt:has-[[data-slot=input-group-control]:focus-visible]:border-ring nt:has-[[data-slot=input-group-control]:focus-visible]:ring-3 nt:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 nt:has-[[data-slot][aria-invalid=true]]:border-destructive nt:has-[[data-slot][aria-invalid=true]]:ring-3 nt:has-[[data-slot][aria-invalid=true]]:ring-destructive/20 nt:has-[>[data-align=block-end]]:h-auto nt:has-[>[data-align=block-end]]:flex-col nt:has-[>[data-align=block-start]]:h-auto nt:has-[>[data-align=block-start]]:flex-col nt:has-[>textarea]:h-auto nt:dark:bg-input/30 nt:dark:has-disabled:bg-input/80 nt:dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 nt:has-[>[data-align=block-end]]:[&>input]:pt-3 nt:has-[>[data-align=block-start]]:[&>input]:pb-3 nt:has-[>[data-align=inline-end]]:[&>input]:pr-1.5 nt:has-[>[data-align=inline-start]]:[&>input]:pl-1.5',
				className
			)}
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	'nt:flex nt:h-auto nt:cursor-text nt:items-center nt:justify-center nt:gap-2 nt:py-1.5 nt:text-sm nt:font-medium nt:text-muted-foreground nt:select-none nt:group-data-[disabled=true]/input-group:opacity-50 nt:[&>kbd]:rounded-[calc(var(--radius)-5px)] nt:[&>svg:not([class*=size-])]:size-4',
	{
		variants: {
			align: {
				'inline-start':
					'nt:order-first nt:pl-2 nt:has-[>button]:ml-[-0.3rem] nt:has-[>kbd]:ml-[-0.15rem]',
				'inline-end':
					'nt:order-last nt:pr-2 nt:has-[>button]:mr-[-0.3rem] nt:has-[>kbd]:mr-[-0.15rem]',
				'block-start':
					'nt:order-first nt:w-full nt:justify-start nt:px-2.5 nt:pt-2 nt:group-has-[>input]/input-group:pt-2 nt:[.border-b]:pb-2',
				'block-end':
					'nt:order-last nt:w-full nt:justify-start nt:px-2.5 nt:pb-2 nt:group-has-[>input]/input-group:pb-2 nt:[.border-t]:pt-2'
			}
		},
		defaultVariants: {
			align: 'inline-start'
		}
	}
);

function InputGroupAddon({
	className,
	align = 'inline-start',
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
	return (
		<div
			role="group"
			data-slot="input-group-addon"
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			onClick={(e) => {
				if ((e.target as HTMLElement).closest('button')) {
					return;
				}
				e.currentTarget.parentElement?.querySelector('input')?.focus();
			}}
			{...props}
		/>
	);
}

const inputGroupButtonVariants = cva(
	'nt:flex nt:items-center nt:gap-2 nt:text-sm nt:shadow-none',
	{
		variants: {
			size: {
				xs: 'nt:h-6 nt:gap-1 nt:rounded-[calc(var(--radius)-3px)] nt:px-1.5 nt:[&>svg:not([class*=size-])]:size-3.5',
				sm: 'nt:',
				'icon-xs':
					'nt:size-6 nt:rounded-[calc(var(--radius)-3px)] nt:p-0 nt:has-[>svg]:p-0',
				'icon-sm': 'nt:size-8 nt:p-0 nt:has-[>svg]:p-0'
			}
		},
		defaultVariants: {
			size: 'xs'
		}
	}
);

function InputGroupButton({
	className,
	type = 'button',
	variant = 'ghost',
	size = 'xs',
	...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> &
	VariantProps<typeof inputGroupButtonVariants>) {
	return (
		<Button
			type={type}
			data-size={size}
			variant={variant}
			className={cn(inputGroupButtonVariants({ size }), className)}
			{...props}
		/>
	);
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			className={cn(
				'nt:flex nt:items-center nt:gap-2 nt:text-sm nt:text-muted-foreground nt:[&_svg]:pointer-events-none nt:[&_svg:not([class*=size-])]:size-4',
				className
			)}
			{...props}
		/>
	);
}

function InputGroupInput({
	className,
	...props
}: React.ComponentProps<'input'>) {
	return (
		<Input
			data-slot="input-group-control"
			className={cn(
				'nt:flex-1 nt:rounded-none nt:border-0 nt:bg-transparent nt:shadow-none nt:ring-0 nt:focus-visible:ring-0 nt:disabled:bg-transparent nt:aria-invalid:ring-0 nt:dark:bg-transparent nt:dark:disabled:bg-transparent',
				className
			)}
			{...props}
		/>
	);
}

function InputGroupTextarea({
	className,
	...props
}: React.ComponentProps<'textarea'>) {
	return (
		<Textarea
			data-slot="input-group-control"
			className={cn(
				'nt:flex-1 nt:resize-none nt:rounded-none nt:border-0 nt:bg-transparent nt:py-2 nt:shadow-none nt:ring-0 nt:focus-visible:ring-0 nt:disabled:bg-transparent nt:aria-invalid:ring-0 nt:dark:bg-transparent nt:dark:disabled:bg-transparent',
				className
			)}
			{...props}
		/>
	);
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupInput,
	InputGroupTextarea
};
