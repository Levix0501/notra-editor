import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const slashMenuPluginKey = new PluginKey('slashMenu');

export interface SlashMenuState {
	active: boolean;
	query: string;
	from: number;
}

export const SlashMenuExtension = Extension.create({
	name: 'slashMenu',
	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: slashMenuPluginKey,
				state: {
					init(): SlashMenuState {
						return { active: false, query: '', from: 0 };
					},
					apply(tr, prev, _oldState, newState) {
						const meta = tr.getMeta(slashMenuPluginKey);

						if (meta) return meta;

						if (!tr.docChanged) return prev;

						const { $from } = newState.selection;
						const textBefore = $from.parent.textBetween(
							0,
							$from.parentOffset,
							undefined
						);

						if (textBefore.startsWith('/')) {
							return {
								active: true,
								query: textBefore.slice(1),
								from: $from.start()
							};
						}

						return { active: false, query: '', from: 0 };
					}
				}
			})
		];
	}
});
