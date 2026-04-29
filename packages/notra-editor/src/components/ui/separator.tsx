'use client';

import * as React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';

import { cn } from '../../lib/utils';

function Separator({
	className,
	orientation = 'horizontal',
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			className={cn(
				'nt:shrink-0 nt:bg-border nt:data-horizontal:h-px nt:data-horizontal:w-full nt:data-vertical:w-px nt:data-vertical:self-stretch',
				className
			)}
			{...props}
		/>
	);
}

export { Separator };
