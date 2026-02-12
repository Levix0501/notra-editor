import { useEditorState } from '@tiptap/react';

import { DEFAULT_STATE } from '../extensions/ui-state';

import type { UiState } from '../extensions/ui-state';
import type { Editor } from '@tiptap/core';

export function useUiState(editor: Editor | null): UiState {
	return (
		useEditorState({
			editor,
			selector: ({ editor }) => {
				if (!editor) return DEFAULT_STATE;

				const state = editor.storage.editorUiState as UiState | undefined;

				if (!state) return DEFAULT_STATE;

				return { ...DEFAULT_STATE, ...state };
			}
		}) ?? DEFAULT_STATE
	);
}
