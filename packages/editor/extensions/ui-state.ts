import { Extension } from '@tiptap/core';

export interface UiState {
	isDragging: boolean;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		editorUiState: {
			setIsDragging: (value: boolean) => ReturnType;
		};
	}

	interface Storage {
		editorUiState: UiState;
	}
}

export const DEFAULT_STATE: UiState = {
	isDragging: false
};

export const EditorUiState = Extension.create({
	name: 'editorUiState',

	addStorage() {
		return { ...DEFAULT_STATE };
	},

	addCommands() {
		return {
			setIsDragging:
				(value: boolean) =>
				({ editor }) => {
					editor.storage.editorUiState.isDragging = value;

					return true;
				}
		};
	}
});
