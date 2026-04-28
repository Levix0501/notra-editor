import { toHtml } from 'hast-util-to-html';

import type { createLowlight } from 'lowlight';

type Lowlight = ReturnType<typeof createLowlight>;

// Server-safe: lowlight + hast-util-to-html are pure JS and run in Node.
// Used by NotraReader's nodeMapping.codeBlock; the editor uses the
// extension's built-in ProseMirror decorations instead.
export function highlightCodeToHtml(
	code: string,
	language: string | null | undefined,
	lowlight: Lowlight
): string {
	if (!code) return '';

	const lang = language ?? 'auto';

	// "plaintext" deliberately skips highlighting — emit only escaped text.
	if (lang === 'plaintext') {
		return toHtml({ type: 'text', value: code });
	}

	const tree =
		lang === 'auto' || !lowlight.registered(lang)
			? lowlight.highlightAuto(code)
			: lowlight.highlight(lang, code);

	return toHtml(tree);
}
