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
				'nta:bg-border nta:shrink-0 data-[orientation=horizontal]:nta:h-px data-[orientation=horizontal]:nta:w-full data-[orientation=vertical]:nta:h-full data-[orientation=vertical]:nta:w-px',
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
