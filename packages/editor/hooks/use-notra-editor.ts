import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useMemo } from 'react';

import type { Editor } from '@tiptap/core';

/**
 * Hook that provides access to a Tiptap editor instance.
 *
 * Accepts an optional editor instance directly, or falls back to retrieving
 * the editor from the Tiptap context if available. This allows components
 * to work both when given an editor directly and when used within a Tiptap
 * editor context.
 *
 * @param providedEditor - Optional editor instance to use instead of the context editor
 * @returns The provided editor or the editor from context, whichever is available
 */
export function useNotraEditor(providedEditor?: Editor | null): {
	editor: Editor | null;
	editorState?: Editor['state'];
} {
	const { editor: contextEditor } = useCurrentEditor();
	const editor = useMemo(
		() => providedEditor ?? contextEditor,
		[providedEditor, contextEditor]
	);

	return (
		useEditorState({
			editor,
			selector(context) {
				return {
					editor: context.editor,
					editorState: context.editor?.state
				};
			}
		}) || { editor: null }
	);
}
