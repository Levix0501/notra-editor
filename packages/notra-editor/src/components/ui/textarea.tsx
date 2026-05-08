import * as React from 'react';

import { cn } from '../../lib/utils.js';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			className={cn(
				'nt:flex nt:field-sizing-content nt:min-h-16 nt:w-full nt:rounded-lg nt:border nt:border-input nt:bg-transparent nt:px-2.5 nt:py-2 nt:text-base nt:transition-colors nt:outline-none nt:placeholder:text-muted-foreground nt:focus-visible:border-ring nt:focus-visible:ring-3 nt:focus-visible:ring-ring/50 nt:disabled:cursor-not-allowed nt:disabled:bg-input/50 nt:disabled:opacity-50 nt:aria-invalid:border-destructive nt:aria-invalid:ring-3 nt:aria-invalid:ring-destructive/20 nt:md:text-sm nt:dark:bg-input/30 nt:dark:disabled:bg-input/80 nt:dark:aria-invalid:border-destructive/50 nt:dark:aria-invalid:ring-destructive/40',
				className
			)}
			data-slot="textarea"
			{...props}
		/>
	);
}

export { Textarea };
