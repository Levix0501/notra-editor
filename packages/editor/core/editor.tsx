import { EditorContent, useEditor } from '@tiptap/react';
import { JSX } from 'react';

import { EditorExtensions } from '../extensions/editor';

export interface EditorProps {
	content?: string;
	onChange?: (content: string) => void;
}

export function Editor({ content = '', onChange }: EditorProps): JSX.Element {
	const editor = useEditor({
		extensions: EditorExtensions,
		content,
		editable: true,
		onUpdate: ({ editor }) => {
			onChange?.(editor.getHTML());
		}
	});

	return <EditorContent editor={editor} />;
}
