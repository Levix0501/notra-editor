'use client';

import {
	NodeViewContent,
	NodeViewWrapper,
	type NodeViewProps
} from '@tiptap/react';

import { CopyButton } from './copy-button';

import type { ReactNode } from 'react';

interface CodeBlockShellProps {
	value: string;
	children: ReactNode;
}

// Visual structure shared by editor (NodeView) and reader (nodeMapping).
// Children is the <code> element (or <NodeViewContent as="code"/>); the
// shell does not wrap it because each consumer mounts <code> differently.
export const CodeBlockShell = ({ value, children }: CodeBlockShellProps) => (
	<div className="nt:relative">
		<div className="nt:absolute nt:inset-x-0 nt:top-0 nt:flex nt:h-9 nt:items-center nt:justify-end nt:px-2">
			<CopyButton value={value} />
		</div>
		<pre className="nt:!pt-9">{children}</pre>
	</div>
);

// Editor-side React NodeView. Tiptap mounts content-editable DOM directly
// onto the <code> rendered by NodeViewContent.
export const CodeBlockView = ({ node }: NodeViewProps) => (
	<NodeViewWrapper>
		<CodeBlockShell value={node.textContent}>
			<NodeViewContent<'code'> as="code" />
		</CodeBlockShell>
	</NodeViewWrapper>
);
