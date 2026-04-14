import { createContext, useContext } from 'react';
import { useCurrentEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';

const NotraEditorContext = createContext<Editor | null>(null);

export const NotraEditorProvider = NotraEditorContext.Provider;

export function useNotraEditor(providedEditor?: Editor | null): { editor: Editor | null } {
	const contextEditor = useContext(NotraEditorContext);
	const { editor: tiptapEditor } = useCurrentEditor();
	const editor = providedEditor ?? contextEditor ?? tiptapEditor ?? null;
	return { editor };
}
