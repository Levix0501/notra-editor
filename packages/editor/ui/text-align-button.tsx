import * as React from 'react';

import { useTextAlign } from '../hooks/use-text-align';
import { Button } from './primitives/button';

import type { AlignmentType } from '../hooks/use-text-align';

export interface TextAlignButtonProps {
	alignment: AlignmentType;
}

export function TextAlignButton({ alignment }: TextAlignButtonProps) {
	const { isVisible, isActive, canAlign, handleAlign, label, Icon } =
		useTextAlign({
			alignment
		});

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleAlign();
		},
		[handleAlign]
	);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			aria-label={label}
			disabled={!canAlign}
			isActive={isActive}
			size="icon-xs"
			variant="ghost"
			onClick={handleClick}
		>
			<Icon size={16} />
		</Button>
	);
}
