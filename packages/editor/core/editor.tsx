import '../styles/editor.css';

import { Placeholder } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

import { EditorExtensions } from '../extensions/editor';
import { getDictionary, I18nProvider } from '../i18n';
import { BlockDragHandle } from '../ui/drag-handle';
import { FixedToolbar } from '../ui/fixed-toolbar';

import type { Locale } from '../i18n';

export interface EditorProps {
	content?: string;
	onChange?: (content: string) => void;
	locale?: Locale;
}

export function Editor({ content = '', onChange, locale = 'en' }: EditorProps) {
	const dictionary = getDictionary(locale);

	const editor = useEditor({
		content,
		editorProps: {
			attributes: {
				autocomplete: 'off',
				autocorrect: 'off',
				autocapitalize: 'off',
				'aria-label': dictionary['editor.ariaLabel'],
				class:
					'flex-1 px-4 sm:px-[max(64px,calc(50%-375px))] pb-[30vh] pt-15 sm:pt-23 outline-none'
			}
		},
		extensions: [
			...EditorExtensions,
			Placeholder.configure({
				placeholder: dictionary['placeholder.default']
			})
		],
		onUpdate: ({ editor }) => onChange?.(editor.getHTML())
	});

	return (
		<div className="notra-editor">
			<I18nProvider locale={locale}>
				<EditorContext.Provider value={{ editor }}>
					<FixedToolbar />

					<EditorContent className="relative" editor={editor}>
						<BlockDragHandle />
					</EditorContent>
				</EditorContext.Provider>
			</I18nProvider>
		</div>
	);
}
