import { useEditorState } from '@tiptap/react';
import * as React from 'react';

import { canToggleMark, isMarkActive, useMark } from '../hooks/use-mark';
import { useNotraEditor } from '../hooks/use-notra-editor';
import { Button } from './primitives/button';

import type { MarkType } from '../hooks/use-mark';

export interface MarkButtonProps {
	type: MarkType;
}

export function MarkButton({ type }: MarkButtonProps) {
	const { editor } = useNotraEditor();

	const { isVisible, handleMark, label, Icon } = useMark({
		editor,
		type
	});

	const editorState = useEditorState({
		editor,
		selector: (ctx) => ({
			canToggle: canToggleMark(ctx.editor, type),
			isActive: isMarkActive(ctx.editor, type)
		})
	});

	const canToggle = editorState?.canToggle ?? false;
	const isActive = editorState?.isActive ?? false;

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleMark();
		},
		[handleMark]
	);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			aria-label={label}
			disabled={!canToggle}
			isActive={isActive}
			size="icon-xs"
			variant="ghost"
			onClick={handleClick}
		>
			<Icon size={16} />
		</Button>
	);
}
