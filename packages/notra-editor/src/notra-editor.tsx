import { EditorContent } from '@tiptap/react';

import { Toolbar, ToolbarGroup } from './components/toolbar/toolbar';
import { UndoRedoButton } from './components/undo-redo-button/undo-redo-button';
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
			<Toolbar variant="fixed">
				<ToolbarGroup>
					<UndoRedoButton action="undo" editor={editor} />
					<UndoRedoButton action="redo" editor={editor} />
				</ToolbarGroup>
			</Toolbar>
			<EditorContent editor={editor} />
		</div>
	);
}
