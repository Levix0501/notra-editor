import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

function DropdownMenu({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot="dropdown-menu-trigger"
			{...props}
		/>
	);
}

function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				className={cn(
					'nta:bg-popover nta:text-popover-foreground data-[state=open]:nta:animate-in data-[state=closed]:nta:animate-out data-[state=closed]:nta:fade-out-0 data-[state=open]:nta:fade-in-0 data-[state=closed]:nta:zoom-out-95 data-[state=open]:nta:zoom-in-95 data-[side=bottom]:nta:slide-in-from-top-2 data-[side=left]:nta:slide-in-from-right-2 data-[side=right]:nta:slide-in-from-left-2 data-[side=top]:nta:slide-in-from-bottom-2 nta:z-50 nta:max-h-(--radix-dropdown-menu-content-available-height) nta:min-w-[8rem] nta:origin-(--radix-dropdown-menu-content-transform-origin) nta:overflow-x-hidden nta:overflow-y-auto nta:rounded-md nta:border nta:p-1 nta:shadow-md',
					className
				)}
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = 'default',
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: 'default' | 'destructive';
}) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"focus:nta:bg-accent focus:nta:text-accent-foreground data-[variant=destructive]:nta:text-destructive data-[variant=destructive]:focus:nta:bg-destructive/10 dark:data-[variant=destructive]:focus:nta:bg-destructive/20 data-[variant=destructive]:focus:nta:text-destructive data-[variant=destructive]:*:[svg]:nta:!text-destructive [&_svg:not([class*='text-'])]:nta:text-muted-foreground nta:relative nta:flex nta:cursor-default nta:items-center nta:gap-2 nta:rounded-sm nta:px-2 nta:py-1.5 nta:text-sm nta:outline-hidden nta:select-none data-[disabled]:nta:pointer-events-none data-[disabled]:nta:opacity-50 data-[inset]:nta:pl-8 [&_svg]:nta:pointer-events-none [&_svg]:nta:shrink-0 [&_svg:not([class*='size-'])]:nta:size-4",
				className
			)}
			data-inset={inset}
			data-slot="dropdown-menu-item"
			data-variant={variant}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem
};
