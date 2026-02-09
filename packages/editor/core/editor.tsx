import '../styles/editor.css';

import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

import { EditorExtensions } from '../extensions/editor';
import { getDictionary, I18nProvider } from '../i18n';
import { FixedToolbar } from '../ui/fixed-toolbar';

import type { Dictionary, Locale } from '../i18n';

export interface EditorProps {
	content?: string;
	onChange?: (content: string) => void;
	locale?: Locale;
	messages?: Partial<Dictionary>;
}

export function Editor({
	content = '',
	onChange,
	locale = 'en',
	messages
}: EditorProps) {
	const dictionary = getDictionary(locale, messages);

	const editor = useEditor({
		content,
		editorProps: {
			attributes: {
				autocomplete: 'off',
				autocorrect: 'off',
				autocapitalize: 'off',
				'aria-label': dictionary['editor.ariaLabel'],
				class:
					'notra-editor flex-1 px-4 sm:px-[max(64px,calc(50%-375px))] pb-[30vh] pt-15 sm:pt-23 outline-none'
			}
		},
		extensions: EditorExtensions,
		onUpdate: ({ editor }) => onChange?.(editor.getHTML())
	});

	return (
		<I18nProvider locale={locale} messages={messages}>
			<EditorContext.Provider value={{ editor }}>
				<FixedToolbar />
				<EditorContent editor={editor} />
			</EditorContext.Provider>
		</I18nProvider>
	);
}
