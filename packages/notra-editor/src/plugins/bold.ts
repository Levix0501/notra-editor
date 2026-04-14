import { Bold } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const boldPlugin = definePlugin({
	name: 'bold',
	extensions: [],
	markdown: {
		serializer: {
			marks: {
				bold: {
					open: '**',
					close: '**',
					mixable: true,
					expelEnclosingWhitespace: true
				}
			}
		},
		parser: {
			tokens: {
				strong: { mark: 'bold' }
			}
		}
	},
	floatingToolbarItems: [
		{
			name: 'bold',
			icon: createElement(Bold, { size: 18 }),
			type: 'button',
			priority: 10,
			group: 'marks',
			isActive: (editor) => editor.isActive('bold'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleBold().run();
			}
		}
	]
});
