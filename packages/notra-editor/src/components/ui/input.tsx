import * as React from 'react';

import { cn } from '../../lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'nt:flex nt:h-9 nt:w-full nt:min-w-0 nt:rounded-md nt:border nt:border-input nt:bg-transparent nt:px-3 nt:py-1 nt:text-base nt:shadow-xs nt:transition-[color,box-shadow] nt:outline-none nt:file:inline-flex nt:file:h-7 nt:file:border-0 nt:file:bg-transparent nt:file:text-sm nt:file:font-medium nt:file:text-foreground nt:placeholder:text-muted-foreground nt:selection:bg-primary nt:selection:text-primary-foreground nt:dark:bg-input/30 nt:md:text-sm nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:dark:aria-invalid:ring-destructive/40 nt:disabled:cursor-not-allowed nt:disabled:opacity-50',
				className
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
