import { definePlugin } from './define-plugin';

export const paragraphPlugin = definePlugin({
	name: 'paragraph',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				paragraph: (state, node) => {
					state.renderInline(node);
					state.closeBlock(node);
				},
			},
		},
		parser: {
			tokens: {
				paragraph: { block: 'paragraph' },
			},
		},
	},
});
