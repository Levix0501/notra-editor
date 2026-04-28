import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';

import { CodeBlockView } from '../components/code-block-view/code-block-view';

type Lowlight = ReturnType<typeof createLowlight>;

// Module-level instance, shared by the default CodeBlockExtension and the
// reader. Loads the lowlight `common` set (~37 mainstream languages, ~150 KB).
// Consumers needing more or fewer languages should call createCodeBlockExtension
// with their own instance and pass the same instance to <NotraReader lowlight={…} />.
export const defaultLowlight: Lowlight = createLowlight(common);

export function createCodeBlockExtension(lowlight: Lowlight) {
	return CodeBlockLowlight.configure({ lowlight }).extend({
		addNodeView() {
			return ReactNodeViewRenderer(CodeBlockView);
		}
	});
}

export const CodeBlockExtension = createCodeBlockExtension(defaultLowlight);
