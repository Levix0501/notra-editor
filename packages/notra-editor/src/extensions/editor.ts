import { ListKit } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

import { starterKitBaseConfig } from './shared';

// Editor extensions = shared content model + interactive features + Markdown
export const editorExtensions = [
	StarterKit.configure(starterKitBaseConfig),
	ListKit,
	Markdown.configure({
		html: false,
		transformPastedText: true,
		transformCopiedText: true
	})
];
