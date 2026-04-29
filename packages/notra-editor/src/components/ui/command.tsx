'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import { cn } from '../../lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from './dialog';
import { InputGroup, InputGroupAddon } from './input-group';
import { SearchIcon, CheckIcon } from 'lucide-react';

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				'nt:flex nt:size-full nt:flex-col nt:overflow-hidden nt:rounded-xl! nt:bg-popover nt:p-1 nt:text-popover-foreground',
				className
			)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = 'Command Palette',
	description = 'Search for a command to run...',
	children,
	className,
	showCloseButton = false,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="nt:sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn(
					'nt:top-1/3 nt:translate-y-0 nt:overflow-hidden nt:rounded-xl! nt:p-0',
					className
				)}
				showCloseButton={showCloseButton}
			>
				{children}
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div data-slot="command-input-wrapper" className="nt:p-1 nt:pb-0">
			<InputGroup className="nt:h-8! nt:rounded-lg! nt:border-input/30 nt:bg-input/30 nt:shadow-none! nt:*:data-[slot=input-group-addon]:pl-2!">
				<CommandPrimitive.Input
					data-slot="command-input"
					className={cn(
						'nt:w-full nt:text-sm nt:outline-hidden nt:disabled:cursor-not-allowed nt:disabled:opacity-50',
						className
					)}
					{...props}
				/>
				<InputGroupAddon>
					<SearchIcon className="nt:size-4 nt:shrink-0 nt:opacity-50" />
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				'nt:no-scrollbar nt:max-h-72 nt:scroll-py-1 nt:overflow-x-hidden nt:overflow-y-auto nt:outline-none',
				className
			)}
			{...props}
		/>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn('nt:py-6 nt:text-center nt:text-sm', className)}
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
			data-slot="command-group"
			className={cn(
				'nt:overflow-hidden nt:p-1 nt:text-foreground nt:**:[[cmdk-group-heading]]:px-2 nt:**:[[cmdk-group-heading]]:py-1.5 nt:**:[[cmdk-group-heading]]:text-xs nt:**:[[cmdk-group-heading]]:font-medium nt:**:[[cmdk-group-heading]]:text-muted-foreground',
				className
			)}
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
			data-slot="command-separator"
			className={cn('nt:-mx-1 nt:h-px nt:bg-border', className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				'nt:group/command-item nt:relative nt:flex nt:cursor-default nt:items-center nt:gap-2 nt:rounded-sm nt:px-2 nt:py-1.5 nt:text-sm nt:outline-hidden nt:select-none nt:in-data-[slot=dialog-content]:rounded-lg! nt:data-[disabled=true]:pointer-events-none nt:data-[disabled=true]:opacity-50 nt:data-selected:bg-muted nt:data-selected:text-foreground nt:[&_svg]:pointer-events-none nt:[&_svg]:shrink-0 nt:[&_svg:not([class*=size-])]:size-4 nt:data-selected:*:[svg]:text-foreground',
				className
			)}
			{...props}
		>
			{children}
			<CheckIcon className="nt:ml-auto nt:opacity-0 nt:group-has-data-[slot=command-shortcut]/command-item:hidden nt:group-data-[checked=true]/command-item:opacity-100" />
		</CommandPrimitive.Item>
	);
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(
				'nt:ml-auto nt:text-xs nt:tracking-widest nt:text-muted-foreground nt:group-data-selected/command-item:text-foreground',
				className
			)}
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
