import { EditorContent } from '@tiptap/react';

import { useMarkdownEditor } from './hooks/use-markdown-editor';

export interface NotraEditorProps {
	/** Markdown content (source of truth) */
	value: string;
	/** Called when content changes, receives updated Markdown */
	onChange: (value: string) => void;
	/** Placeholder text shown when editor is empty */
	placeholder?: string;
	/** Disable editing */
	readOnly?: boolean;
	/** Additional CSS class on the wrapper element */
	className?: string;
}

export function NotraEditor({
	value,
	onChange,
	placeholder,
	readOnly = false,
	className
}: NotraEditorProps) {
	const { editor } = useMarkdownEditor({
		value,
		onChange,
		placeholder,
		editable: !readOnly
	});

	const classNames = ['notra', 'notra-editor', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={classNames}>
			<EditorContent editor={editor} />
		</div>
	);
}
