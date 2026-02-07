import { useCurrentEditor, useEditorState } from '@tiptap/react';

import type { Editor } from '@tiptap/core';

// useCurrentEditor only reads from context and won't re-render on transactions.
// useEditorState subscribes to editor state changes, ensuring UI stays in sync.
export function useNotraEditor(): {
	editor: Editor | null;
} {
	const { editor } = useCurrentEditor();

	return (
		useEditorState({
			editor,
			selector(context) {
				return { editor: context.editor };
			}
		}) || { editor: null }
	);
}
