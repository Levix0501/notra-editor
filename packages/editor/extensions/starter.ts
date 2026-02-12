import { StarterKit } from '@tiptap/starter-kit';

export const Starter = StarterKit.configure({
	horizontalRule: false,
	codeBlock: false,
	dropcursor: { width: 2 },
	link: {
		openOnClick: false,
		autolink: true,
		defaultProtocol: 'https',
		HTMLAttributes: {
			rel: 'noopener noreferrer',
			target: '_blank'
		}
	}
});
