import TiptapHorizontalRule from '@tiptap/extension-horizontal-rule';
import { mergeAttributes } from '@tiptap/react';

// Wrapper div enables better cursor positioning around the rule
export const HorizontalRule = TiptapHorizontalRule.extend({
	renderHTML() {
		return [
			'div',
			mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
			['hr']
		];
	}
});
