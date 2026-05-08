import { CopyButton } from '../copy-button.js';

import type { ReactNode } from 'react';

interface CodeBlockShellProps {
	value: string;
	languageSlot: ReactNode;
	children: ReactNode;
}

// Visual frame shared by the editor (NodeView) and reader (nodeMapping).
// `languageSlot` lets each consumer plug its own widget into the top bar:
// the editor passes <LanguageSelect>, the reader passes a static label.
// `children` is the <code> element (NodeViewContent in the editor, a
// dangerouslySetInnerHTML <code> in the reader).
export const CodeBlockShell = ({
	value,
	languageSlot,
	children
}: CodeBlockShellProps) => (
	<div className="nt:relative">
		<div className="nt:absolute nt:inset-x-0 nt:top-0 nt:flex nt:h-9 nt:items-center nt:justify-between nt:px-2">
			<div className="nt:min-w-0 nt:flex-1">{languageSlot}</div>
			<CopyButton value={value} />
		</div>
		<pre className="nt:!pt-9 hljs">{children}</pre>
	</div>
);
