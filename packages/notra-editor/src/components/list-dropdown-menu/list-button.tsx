import { forwardRef, useCallback } from 'react';

import { useList } from './use-list';
import { CheckIcon } from '../../icons/check-icon';
import { Button } from '../button/button';

import type { ListType } from './use-list';
import type { Editor } from '@tiptap/core';

export interface ListButtonProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
	listType: ListType;
}

export const ListButton = forwardRef<HTMLButtonElement, ListButtonProps>(
	({ editor, listType, onClick, ...buttonProps }, ref) => {
		const { isActive, canToggle, handleToggle, label, Icon } = useList({
			editor,
			type: listType
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
				role="menuitem"
				tabIndex={-1}
				type="button"
				variant="ghost"
				onClick={handleClick}
				{...buttonProps}
			>
				<Icon className="tiptap-button-icon" />
				<span className="tiptap-button-text">{label}</span>
				{isActive && <CheckIcon />}
			</Button>
		);
	}
);

ListButton.displayName = 'ListButton';
