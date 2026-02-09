import { useEditorState } from '@tiptap/react';
import * as React from 'react';

import { canToggleBlockquote, useBlockquote } from '../hooks/use-blockquote';
import { useNotraEditor } from '../hooks/use-notra-editor';
import { Button } from './primitives/button';

export function BlockquoteButton() {
	const { editor } = useNotraEditor();

	const { isVisible, handleToggle, label, Icon } = useBlockquote({
		editor
	});

	const editorState = useEditorState({
		editor,
		selector: (ctx) => ({
			canToggle: canToggleBlockquote(ctx.editor),
			isActive: ctx.editor?.isActive('blockquote') ?? false
		})
	});

	const canToggle = editorState?.canToggle ?? false;
	const isActive = editorState?.isActive ?? false;

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			if (event.defaultPrevented) return;

			handleToggle();
		},
		[handleToggle]
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
