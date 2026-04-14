import { Link2 } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from '../define-plugin';

export const linkPlugin = definePlugin({
	name: 'link',
	extensions: [],
	markdown: {
		serializer: {
			marks: {
				link: {
					open: () => '[',
					close: (_state, mark) => '](' + (mark.attrs.href as string) + ')'
				}
			}
		},
		parser: {
			tokens: {
				link: {
					mark: 'link',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					getAttrs: (token: any) => ({
						href: token.attrGet('href'),
						title: token.attrGet('title') || null
					})
				}
			}
		}
	},
	floatingToolbarItems: [
		{
			name: 'link',
			icon: createElement(Link2, { size: 18 }),
			type: 'button',
			priority: 50,
			group: 'marks',
			isActive: (editor) => editor.isActive('link'),
			command: (editor) => {
				/* eslint-disable @typescript-eslint/no-explicit-any */
				if ((editor as any).isActive('link')) {
					(editor as any).chain().focus().unsetMark('link').run();
				} else {
					const url = window.prompt('Enter URL');

					if (url) {
						(editor as any)
							.chain()
							.focus()
							.setMark('link', { href: url })
							.run();
					}
				}
				/* eslint-enable @typescript-eslint/no-explicit-any */
			}
		}
	]
});
