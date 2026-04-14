import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useEffect } from 'react';

import { CopyButton } from './copy-button';
import { LanguageSelect, resolveLanguageAlias } from './language-select';

import type { NodeViewProps } from '@tiptap/react';

export function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
	const rawLanguage = node.attrs.language || '';
	const language = resolveLanguageAlias(rawLanguage);

	// Normalize the stored attribute when an alias (e.g. "js") resolves to a full name.
	// Deferred via microtask to avoid flushSync during React render cycle.
	useEffect(() => {
		if (rawLanguage && language !== rawLanguage) {
			queueMicrotask(() => updateAttributes({ language }));
		}
	}, [rawLanguage, language, updateAttributes]);

	return (
		<NodeViewWrapper>
			<div className="relative">
				<pre className="hljs !p-0">
					<div className="flex h-9 items-center justify-between px-2">
						<LanguageSelect
							language={language || 'auto'}
							onLanguageChange={(lang) => updateAttributes({ language: lang })}
						/>
						<CopyButton value={node.textContent} />
					</div>
					<code className="!p-0">
						<NodeViewContent className="scrollbar-hide max-h-[500px] overflow-auto p-4 pt-0" />
					</code>
				</pre>
			</div>
		</NodeViewWrapper>
	);
}
