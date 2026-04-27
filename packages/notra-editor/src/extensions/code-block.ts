import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { CodeBlockView } from '../components/code-block-view';

export const CodeBlockExtension = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockView);
	}
});
