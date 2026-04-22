import { forwardRef, useCallback } from 'react';

import { useMark } from './use-mark';
import { Button } from '../button/button';

import type { MarkType } from './use-mark';
import type { Editor } from '@tiptap/core';

export interface MarkButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
	type: MarkType;
}

export const MarkButton = forwardRef<HTMLButtonElement, MarkButtonProps>(
	({ editor, type, onClick, ...buttonProps }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useMark({
			editor,
			type
		});

		const handleClick = useCallback(
			(event: React.MouseEvent<HTMLButtonElement>) => {
				onClick?.(event);

				if (event.defaultPrevented) return;

				handleToggle();
			},
			[handleToggle, onClick]
		);

		return (
			<Button
				ref={ref}
				aria-label={label}
				aria-pressed={isActive}
				data-active-state={isActive ? 'on' : 'off'}
				disabled={!canToggle}
				tabIndex={-1}
				type="button"
				variant="ghost"
				onClick={handleClick}
				{...buttonProps}
			>
				<Icon className="tiptap-button-icon" />
			</Button>
		);
	}
);

MarkButton.displayName = 'MarkButton';
