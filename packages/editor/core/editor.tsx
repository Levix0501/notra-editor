import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { JSX } from 'react';

export interface EditorProps {
	content?: string;
	onChange?: (content: string) => void;
	placeholder?: string;
	editable?: boolean;
}

export function Editor({
	content = '',
	onChange,
	editable = true
}: EditorProps): JSX.Element {
	const editor = useEditor({
		extensions: [StarterKit],
		content,
		editable,
		onUpdate: ({ editor }) => {
			onChange?.(editor.getHTML());
		}
	});

	return <EditorContent editor={editor} />;
}

export default Editor;
