import { definePlugin } from './define-plugin';

export const hardBreakPlugin = definePlugin({
	name: 'hardBreak',
	extensions: [],
	markdown: {
		serializer: {
			nodes: {
				hardBreak: (state, _node, parent, index) => {
					// Do not serialize trailing hard breaks
					const isTrailing =
						index === parent.childCount - 1 ||
						(index === parent.childCount - 2 &&
							parent.child(index + 1).type.name === 'text' &&
							parent.child(index + 1).text === '\n');

					if (!isTrailing) {
						state.write('  \n');
					}
				}
			}
		},
		parser: {
			tokens: {
				hardbreak: { node: 'hardBreak' }
			}
		}
	}
});
