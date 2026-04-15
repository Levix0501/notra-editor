import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';
import * as React from 'react';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from './dialog';
import { cn } from '../../lib/utils';

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			className={cn(
				'nta:bg-popover nta:text-popover-foreground nta:flex nta:h-full nta:w-full nta:flex-col nta:overflow-hidden nta:rounded-md',
				className
			)}
			data-slot="command"
			{...props}
		/>
	);
}

function CommandDialog({
	title = 'Command Palette',
	description = 'Search for a command to run...',
	children,
	className,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="nta:sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn('nta:overflow-hidden nta:p-0', className)}
				showCloseButton={showCloseButton}
			>
				<Command className="[&_[cmdk-group-heading]]:nta:text-muted-foreground **:data-[slot=command-input-wrapper]:nta:h-12 [&_[cmdk-group-heading]]:nta:px-2 [&_[cmdk-group-heading]]:nta:font-medium [&_[cmdk-group]]:nta:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:nta:pt-0 [&_[cmdk-input-wrapper]_svg]:nta:h-5 [&_[cmdk-input-wrapper]_svg]:nta:w-5 [&_[cmdk-input]]:nta:h-12 [&_[cmdk-item]]:nta:px-2 [&_[cmdk-item]]:nta:py-3 [&_[cmdk-item]_svg]:nta:h-5 [&_[cmdk-item]_svg]:nta:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			className="nta:flex nta:h-9 nta:items-center nta:gap-2 nta:border-b nta:px-3"
			data-slot="command-input-wrapper"
		>
			<SearchIcon className="nta:size-4 nta:shrink-0 nta:opacity-50" />
			<CommandPrimitive.Input
				className={cn(
					'placeholder:nta:text-muted-foreground nta:flex nta:h-10 nta:w-full nta:rounded-md nta:bg-transparent nta:py-3 nta:text-sm nta:outline-hidden disabled:nta:cursor-not-allowed disabled:nta:opacity-50',
					className
				)}
				data-slot="command-input"
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			className={cn(
				'nta:max-h-[300px] nta:scroll-py-1 nta:overflow-x-hidden nta:overflow-y-auto',
				className
			)}
			data-slot="command-list"
			{...props}
		/>
	);
}

function CommandEmpty({
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			className="nta:py-6 nta:text-center nta:text-sm"
			data-slot="command-empty"
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			className={cn(
				'nta:text-foreground [&_[cmdk-group-heading]]:nta:text-muted-foreground nta:overflow-hidden nta:p-1 [&_[cmdk-group-heading]]:nta:px-2 [&_[cmdk-group-heading]]:nta:py-1.5 [&_[cmdk-group-heading]]:nta:text-xs [&_[cmdk-group-heading]]:nta:font-medium',
				className
			)}
			data-slot="command-group"
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			className={cn('nta:bg-border nta:-mx-1 nta:h-px', className)}
			data-slot="command-separator"
			{...props}
		/>
	);
}

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			className={cn(
				"data-[selected=true]:nta:bg-accent data-[selected=true]:nta:text-accent-foreground [&_svg:not([class*='text-'])]:nta:text-muted-foreground nta:relative nta:flex nta:cursor-default nta:items-center nta:gap-2 nta:rounded-sm nta:px-2 nta:py-1.5 nta:text-sm nta:outline-hidden nta:select-none data-[disabled=true]:nta:pointer-events-none data-[disabled=true]:nta:opacity-50 [&_svg]:nta:pointer-events-none [&_svg]:nta:shrink-0 [&_svg:not([class*='size-'])]:nta:size-4",
				className
			)}
			data-slot="command-item"
			{...props}
		/>
	);
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<'span'>) {
	return (
		<span
			className={cn(
				'nta:text-muted-foreground nta:ml-auto nta:text-xs nta:tracking-widest',
				className
			)}
			data-slot="command-shortcut"
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator
};
