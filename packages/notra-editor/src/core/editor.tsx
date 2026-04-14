import '../styles/editor.css';

import { useEffect, useMemo, useRef } from 'react';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

import {
	collectExtensions,
	collectFloatingToolbarItems,
	collectMarkdownRules,
	collectSlashCommands,
	collectToolbarItems
} from './create-editor';
import { NotraEditorProvider } from './editor-context';
import { buildMarkdownParser, buildMarkdownSerializer } from '../markdown';
import { defaultPlugins } from '../plugins/default-plugins';
import { SlashMenuExtension } from '../slash-menu/slash-extension';
import { SlashMenu } from '../slash-menu/slash-menu';
import { FixedToolbar } from '../toolbar/fixed-toolbar';
import { FloatingToolbar } from '../toolbar/floating-toolbar';
import { buildThemeStyle } from '../theme/theme-provider';
import { getDictionary, I18nProvider } from '../i18n';
import { cn } from '../lib/utils';

import type { NotraEditorProps } from '../types';
import type { Locale } from '../i18n';

export function NotraEditor({
	content = '',
	onChange,
	plugins = defaultPlugins,
	theme,
	locale = 'en',
	editable = true,
	toolbar = 'both',
	placeholder: placeholderText,
	className
}: NotraEditorProps) {
	const dictionary = getDictionary(locale);
	const contentInitialized = useRef(false);

	const extensions = useMemo(
		() => [
			...collectExtensions(plugins),
			SlashMenuExtension,
			Placeholder.configure({
				placeholder: placeholderText ?? dictionary['placeholder.default']
			})
		],
		[plugins, placeholderText, dictionary]
	);

	const markdownRules = useMemo(() => collectMarkdownRules(plugins), [plugins]);
	const toolbarItems = useMemo(() => collectToolbarItems(plugins), [plugins]);
	const floatingItems = useMemo(
		() => collectFloatingToolbarItems(plugins),
		[plugins]
	);
	const slashCommands = useMemo(
		() => collectSlashCommands(plugins),
		[plugins]
	);

	const editor = useEditor({
		extensions,
		editable,
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
		onUpdate: ({ editor: ed }) => {
			if (!onChange) return;

			const serializer = buildMarkdownSerializer(markdownRules);
			const md = serializer.serialize(ed.state.doc);

			onChange(md);
		}
	});

	// Parse initial markdown content into ProseMirror document
	useEffect(() => {
		if (!editor || !editor.schema || contentInitialized.current) return;

		if (!content) {
			contentInitialized.current = true;

			return;
		}

		const parser = buildMarkdownParser(editor.schema, markdownRules);
		const doc = parser.parse(content);

		if (doc) {
			editor.commands.setContent(doc.toJSON());
		}

		contentInitialized.current = true;
	}, [editor, content, markdownRules]);

	const themeStyle = useMemo(() => buildThemeStyle(theme), [theme]);
	const showFixed = toolbar === 'fixed' || toolbar === 'both';
	const showFloating = toolbar === 'floating' || toolbar === 'both';

	return (
		<div className={cn('notra-editor', className)} style={themeStyle}>
			<I18nProvider locale={locale as Locale}>
				<EditorContext.Provider value={{ editor }}>
					<NotraEditorProvider value={editor}>
						{showFixed && (
							<FixedToolbar editor={editor} items={toolbarItems} />
						)}
						<EditorContent className="relative" editor={editor} />
						{showFloating && (
							<FloatingToolbar editor={editor} items={floatingItems} />
						)}
						<SlashMenu commands={slashCommands} editor={editor} />
					</NotraEditorProvider>
				</EditorContext.Provider>
			</I18nProvider>
		</div>
	);
}
