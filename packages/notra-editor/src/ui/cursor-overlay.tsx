import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';
import type { CSSProperties } from 'react';

export interface CursorOverlayProps {
	editor: Editor;
}

/**
 * Renders a static caret at the current cursor position.
 * Used when the editor loses focus but we want to keep
 * showing where the cursor was (e.g. when a popover is open).
 */
export function CursorOverlay({ editor }: CursorOverlayProps) {
	const [style, setStyle] = useState<CSSProperties | null>(null);

	useEffect(() => {
		// Skip when editor is focused — the native caret is already visible
		if (editor.view.hasFocus()) {
			setStyle(null);

			return;
		}

		const pos = editor.state.selection.from;
		const coords = editor.view.coordsAtPos(pos);
		const editorEl = editor.view.dom;
		const caretColor = getComputedStyle(editorEl).caretColor || 'currentColor';

		setStyle({
			left: coords.left,
			top: coords.top,
			height: coords.bottom - coords.top,
			backgroundColor: caretColor
		});
	}, [editor]);

	if (!style) return null;

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed z-50 w-px"
			style={style}
		/>
	);
}
