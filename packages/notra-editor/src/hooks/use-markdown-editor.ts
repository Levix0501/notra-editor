import { useEditor } from '@tiptap/react';
import { EditorState } from '@tiptap/pm/state';
import { useEffect, useRef } from 'react';

import { editorExtensions } from '../extensions';

import type { MarkdownStorage } from 'tiptap-markdown';

export interface UseMarkdownEditorOptions {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	editable?: boolean;
}

function getMarkdown(storage: Record<string, unknown>): string {
	return (storage.markdown as MarkdownStorage).getMarkdown();
}

export function useMarkdownEditor({
	value,
	onChange,
	editable = true
}: UseMarkdownEditorOptions) {
	const externalValue = useRef(value);
	const onChangeRef = useRef(onChange);

	onChangeRef.current = onChange;

	const editor = useEditor({
		extensions: editorExtensions,
		editable,
		content: value,
		onUpdate({ editor }) {
			const md = getMarkdown(
				editor.storage as unknown as Record<string, unknown>
			);

			externalValue.current = md;
			onChangeRef.current(md);
		},
		onCreate({ editor }) {
			// Browser-specific behaviors (MutationObserver, DOM reconciliation)
			// may create unwanted transactions during mount, polluting the history
			// and making undo available before the user has made any changes.
			// Reset the editor state after initialization to ensure a clean history.
			setTimeout(() => {
				if (editor.isDestroyed) return;
				const { state } = editor;
				const freshState = EditorState.create({
					doc: state.doc,
					selection: state.selection,
					plugins: state.plugins,
				});
				editor.view.updateState(freshState);
				// Dispatch empty transaction to notify state listeners (undo/redo buttons)
				editor.view.dispatch(editor.view.state.tr);
			}, 0);
		}
	});

	useEffect(() => {
		if (!editor) return;

		if (value === externalValue.current) return;

		externalValue.current = value;
		editor.commands.setContent(value);
	}, [value, editor]);

	useEffect(() => {
		if (!editor) return;

		editor.setEditable(editable);
	}, [editable, editor]);

	return { editor };
}
