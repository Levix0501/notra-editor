import { ListKit } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

export const defaultExtensions = [
	StarterKit.configure({
		heading: { levels: [1, 2, 3, 4, 5, 6] },
		link: {
			openOnClick: false,
			autolink: true
		},
		// Disable StarterKit's built-in list handling; use @tiptap/extension-list instead
		bulletList: false,
		orderedList: false,
		listItem: false,
		listKeymap: false
	}),
	ListKit,
	Markdown.configure({
		html: false,
		transformPastedText: true,
		transformCopiedText: true
	})
];
