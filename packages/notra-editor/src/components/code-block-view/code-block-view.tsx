'use client';

import {
	NodeViewContent,
	NodeViewWrapper,
	type NodeViewProps
} from '@tiptap/react';

import { CodeBlockShell } from './code-block-shell';
import { LanguageSelect } from './language-select';

// Editor-side React NodeView. Tiptap mounts content-editable DOM directly
// onto the <code> rendered by NodeViewContent. lowlight decorates that
// content with <span class="hljs-*"> spans on every transaction.
export const CodeBlockView = ({ node, updateAttributes }: NodeViewProps) => (
	<NodeViewWrapper>
		<CodeBlockShell
			languageSlot={
				<LanguageSelect
					language={(node.attrs.language as string) ?? ''}
					onLanguageChange={(language) => updateAttributes({ language })}
				/>
			}
			value={node.textContent}
		>
			<NodeViewContent<'code'> as="code" className="hljs" />
		</CodeBlockShell>
	</NodeViewWrapper>
);
