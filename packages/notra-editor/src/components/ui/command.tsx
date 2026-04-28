import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			className={cn(
				'nt:flex nt:h-full nt:w-full nt:flex-col nt:overflow-hidden nt:rounded-lg nt:bg-popover nt:text-popover-foreground',
				className
			)}
			data-slot="command"
			{...props}
		/>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			className="nt:flex nt:items-center nt:gap-2 nt:border-b nt:border-foreground/10 nt:px-3"
			data-slot="command-input-wrapper"
		>
			<SearchIcon className="nt:size-4 nt:shrink-0 nt:opacity-50" />
			<CommandPrimitive.Input
				className={cn(
					'nt:flex nt:h-9 nt:w-full nt:rounded-md nt:bg-transparent nt:py-3 nt:text-sm nt:outline-hidden nt:placeholder:text-muted-foreground nt:disabled:cursor-not-allowed nt:disabled:opacity-50',
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
				'nt:max-h-[300px] nt:scroll-py-1 nt:overflow-x-hidden nt:overflow-y-auto',
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
			className="nt:py-6 nt:text-center nt:text-sm"
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
				'nt:overflow-hidden nt:p-1 nt:text-foreground nt:[&_[cmdk-group-heading]]:px-2 nt:[&_[cmdk-group-heading]]:py-1.5 nt:[&_[cmdk-group-heading]]:text-xs nt:[&_[cmdk-group-heading]]:font-medium nt:[&_[cmdk-group-heading]]:text-muted-foreground',
				className
			)}
			data-slot="command-group"
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
				'nt:relative nt:flex nt:cursor-default nt:items-center nt:gap-2 nt:rounded-md nt:px-2 nt:py-1.5 nt:text-sm nt:outline-hidden nt:select-none nt:data-[selected=true]:bg-accent nt:data-[selected=true]:text-accent-foreground nt:data-[disabled=true]:pointer-events-none nt:data-[disabled=true]:opacity-50',
				className
			)}
			data-slot="command-item"
			{...props}
		/>
	);
}

export {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
};
