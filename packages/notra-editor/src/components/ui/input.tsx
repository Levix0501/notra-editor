import * as React from 'react';

import { cn } from '../../lib/utils.js';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'nt:h-8 nt:w-full nt:min-w-0 nt:rounded-lg nt:border nt:border-input nt:bg-transparent nt:px-2.5 nt:py-1 nt:text-base nt:transition-colors nt:outline-none nt:file:inline-flex nt:file:h-6 nt:file:border-0 nt:file:bg-transparent nt:file:text-sm nt:file:font-medium nt:file:text-foreground nt:placeholder:text-muted-foreground nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50 nt:disabled:pointer-events-none nt:disabled:cursor-not-allowed nt:disabled:bg-input/50 nt:disabled:opacity-50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:md:text-sm nt:dark:bg-input/30 nt:dark:disabled:bg-input/80 nt:dark:aria-invalid:border-destructive/50 nt:dark:aria-invalid:ring-destructive/40',
				className
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
