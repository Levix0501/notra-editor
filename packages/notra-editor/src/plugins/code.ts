import { CodeXml } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const codePlugin = definePlugin({
	name: 'code',
	extensions: [],
	markdown: {
		serializer: {
			marks: {
				code: {
					open: '`',
					close: '`',
					escape: false
				}
			}
		},
		parser: {
			tokens: {
				code_inline: { mark: 'code' }
			}
		}
	},
	floatingToolbarItems: [
		{
			name: 'code',
			icon: createElement(CodeXml, { size: 18 }),
			type: 'button',
			priority: 40,
			group: 'marks',
			isActive: (editor) => editor.isActive('code'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor.chain().focus() as any).toggleCode().run();
			}
		}
	]
});
