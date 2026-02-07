import '../styles/editor.css';

import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

import { EditorExtensions } from '../extensions/editor';
import { FixedToolbar } from '../ui/fixed-toolbar';

export interface EditorProps {
	content?: string;
	onChange?: (content: string) => void;
}

export function Editor({ content = '', onChange }: EditorProps) {
	const editor = useEditor({
		content,
		editorProps: {
			attributes: {
				autocomplete: 'off',
				autocorrect: 'off',
				autocapitalize: 'off',
				'aria-label': 'Main content area, start typing to enter text.',
				class:
					'notra-editor flex-1 px-4 sm:px-[max(64px,calc(50%-375px))] pb-[30vh] pt-15 sm:pt-23 outline-none'
			}
		},
		extensions: EditorExtensions,
		onUpdate: ({ editor }) => onChange?.(editor.getHTML())
	});

	return (
		<EditorContext.Provider value={{ editor }}>
			<FixedToolbar />
			<EditorContent editor={editor} />
		</EditorContext.Provider>
	);
}
