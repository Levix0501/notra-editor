import { Italic } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const italicPlugin = definePlugin({
	name: 'italic',
	extensions: [],
	markdown: {
		serializer: {
			marks: {
				italic: {
					open: '*',
					close: '*',
					mixable: true,
					expelEnclosingWhitespace: true
				}
			}
		},
		parser: {
			tokens: {
				em: { mark: 'italic' }
			}
		}
	},
	floatingToolbarItems: [
		{
			name: 'italic',
			icon: createElement(Italic, { size: 18 }),
			type: 'button',
			priority: 20,
			group: 'marks',
			isActive: (editor) => editor.isActive('italic'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleItalic().run();
			}
		}
	]
});
