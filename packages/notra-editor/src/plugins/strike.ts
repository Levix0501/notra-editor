import { Strikethrough } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const strikePlugin = definePlugin({
	name: 'strike',
	extensions: [],
	markdown: {
		serializer: {
			marks: {
				strike: {
					open: '~~',
					close: '~~',
					mixable: true,
					expelEnclosingWhitespace: true
				}
			}
		},
		parser: {
			tokens: {
				s: { mark: 'strike' }
			}
		}
	},
	floatingToolbarItems: [
		{
			name: 'strike',
			icon: createElement(Strikethrough, { size: 18 }),
			type: 'button',
			priority: 30,
			group: 'marks',
			isActive: (editor) => editor.isActive('strike'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleStrike().run();
			}
		}
	]
});
