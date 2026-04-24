import { Separator as SeparatorPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../../lib/utils';

function Separator({
	className,
	orientation = 'horizontal',
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			className={cn(
				'nt:shrink-0 nt:bg-border nt:data-[orientation=horizontal]:h-px nt:data-[orientation=horizontal]:w-full nt:data-[orientation=vertical]:h-full nt:data-[orientation=vertical]:w-px',
				className
			)}
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			{...props}
		/>
	);
}

export { Separator };
