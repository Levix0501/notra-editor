'use client';

import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { Button } from './button';
import { cn } from '../../lib/utils';

function Dialog({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				'nt:fixed nt:inset-0 nt:isolate nt:z-50 nt:bg-black/10 nt:duration-100 nt:supports-backdrop-filter:backdrop-blur-xs nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-closed:animate-out nt:data-closed:fade-out-0',
				className
			)}
			data-slot="dialog-overlay"
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					'nt:fixed nt:top-1/2 nt:left-1/2 nt:z-50 nt:grid nt:w-full nt:max-w-[calc(100%-2rem)] nt:-translate-x-1/2 nt:-translate-y-1/2 nt:gap-4 nt:rounded-xl nt:bg-popover nt:p-4 nt:text-sm nt:text-popover-foreground nt:ring-1 nt:ring-foreground/10 nt:duration-100 nt:outline-none nt:sm:max-w-sm nt:data-open:animate-in nt:data-open:fade-in-0 nt:data-open:zoom-in-95 nt:data-closed:animate-out nt:data-closed:fade-out-0 nt:data-closed:zoom-out-95',
					className
				)}
				data-slot="dialog-content"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close asChild data-slot="dialog-close">
						<Button
							className="nt:absolute nt:top-2 nt:right-2"
							size="icon-sm"
							variant="ghost"
						>
							<XIcon />
							<span className="nt:sr-only">Close</span>
						</Button>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn('nt:flex nt:flex-col nt:gap-2', className)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<'div'> & {
	showCloseButton?: boolean;
}) {
	return (
		<div
			className={cn(
				'nt:-mx-4 nt:-mb-4 nt:flex nt:flex-col-reverse nt:gap-2 nt:rounded-b-xl nt:border-t nt:bg-muted/50 nt:p-4 nt:sm:flex-row nt:sm:justify-end',
				className
			)}
			data-slot="dialog-footer"
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close asChild>
					<Button variant="outline">Close</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn(
				'nt:font-heading nt:text-base nt:leading-none nt:font-medium',
				className
			)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn(
				'nt:text-sm nt:text-muted-foreground nt:*:[a]:underline nt:*:[a]:underline-offset-3 nt:*:[a]:hover:text-foreground',
				className
			)}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger
};
