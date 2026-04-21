import { useEditor } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import type { MarkdownStorage } from 'tiptap-markdown';

import { defaultExtensions } from '../extensions';

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
		extensions: defaultExtensions,
		editable,
		content: value,
		onUpdate({ editor }) {
			const md = getMarkdown(editor.storage as unknown as Record<string, unknown>);
			externalValue.current = md;
			onChangeRef.current(md);
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
