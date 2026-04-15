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
			<div className="nta:relative">
				<pre className="hljs nta:!p-0">
					<div className="nta:flex nta:h-9 nta:items-center nta:justify-between nta:px-2">
						<LanguageSelect
							language={language || 'auto'}
							onLanguageChange={(lang) => updateAttributes({ language: lang })}
						/>
						<CopyButton value={node.textContent} />
					</div>
					<code className="nta:!p-0">
						<NodeViewContent className="nta:scrollbar-hide nta:max-h-[500px] nta:overflow-auto nta:p-4 nta:pt-0" />
					</code>
				</pre>
			</div>
		</NodeViewWrapper>
	);
}
