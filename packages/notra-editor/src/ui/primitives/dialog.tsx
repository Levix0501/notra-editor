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
				'data-[state=open]:nta:animate-in data-[state=closed]:nta:animate-out data-[state=closed]:nta:fade-out-0 data-[state=open]:nta:fade-in-0 nta:fixed nta:inset-0 nta:z-50 nta:bg-black/50',
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
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					'nta:bg-background data-[state=open]:nta:animate-in data-[state=closed]:nta:animate-out data-[state=closed]:nta:fade-out-0 data-[state=open]:nta:fade-in-0 data-[state=closed]:nta:zoom-out-95 data-[state=open]:nta:zoom-in-95 nta:fixed nta:top-[50%] nta:left-[50%] nta:z-50 nta:grid nta:w-full nta:max-w-[calc(100%-2rem)] nta:translate-x-[-50%] nta:translate-y-[-50%] nta:gap-4 nta:rounded-lg nta:border nta:p-6 nta:shadow-lg nta:duration-200 nta:outline-none sm:nta:max-w-lg',
					className
				)}
				data-slot="dialog-content"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						className="nta:ring-offset-background focus:nta:ring-ring data-[state=open]:nta:bg-accent data-[state=open]:nta:text-muted-foreground nta:absolute nta:top-4 nta:right-4 nta:rounded-xs nta:opacity-70 nta:transition-opacity hover:nta:opacity-100 focus:nta:ring-2 focus:nta:ring-offset-2 focus:nta:outline-hidden disabled:nta:pointer-events-none [&_svg]:nta:pointer-events-none [&_svg]:nta:shrink-0 [&_svg:not([class*='size-'])]:nta:size-4"
						data-slot="dialog-close"
					>
						<XIcon />
						<span className="nta:sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'nta:flex nta:flex-col nta:gap-2 nta:text-center sm:nta:text-left',
				className
			)}
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
				'nta:flex nta:flex-col-reverse nta:gap-2 sm:nta:flex-row sm:nta:justify-end',
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
				'nta:text-lg nta:leading-none nta:font-semibold',
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
			className={cn('nta:text-muted-foreground nta:text-sm', className)}
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
