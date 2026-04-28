import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { CodeBlockExtension } from '../src/extensions/code-block';

import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

// Simulated input runs in a microtask + setTimeout(0); flush both.
const flushInputRules = () =>
	new Promise<void>((resolve) => setTimeout(resolve, 0));

function createEditor(): Editor {
	return new Editor({
		element: document.createElement('div'),
		extensions: [
			// StarterKit ships codeBlock; disable it so CodeBlockExtension
			// (the lowlight-extended one we are testing) owns the schema.
			StarterKit.configure({ codeBlock: false }),
			CodeBlockExtension
		]
	});
}

function findCodeBlock(editor: Editor): ProseMirrorNode | null {
	let found: ProseMirrorNode | null = null;

	editor.state.doc.descendants((node) => {
		if (node.type.name === 'codeBlock') {
			found = node;

			return false;
		}

		return true;
	});

	return found;
}

describe('CodeBlockExtension input rule', () => {
	let editor: Editor | null = null;

	afterEach(() => {
		editor?.destroy();
		editor = null;
	});

	it('rewrites a backtick fence with a hljs alias to its canonical value', async () => {
		editor = createEditor();
		editor.commands.insertContent('```js\n', { applyInputRules: true });
		await flushInputRules();

		const block = findCodeBlock(editor);

		expect(block).not.toBeNull();
		expect(block?.attrs.language).toBe('javascript');
	});

	it('rewrites a tilde fence with an alias the same way', async () => {
		editor = createEditor();
		editor.commands.insertContent('~~~py\n', { applyInputRules: true });
		await flushInputRules();

		expect(findCodeBlock(editor)?.attrs.language).toBe('python');
	});

	it('keeps a canonical language unchanged', async () => {
		editor = createEditor();
		editor.commands.insertContent('```typescript\n', {
			applyInputRules: true
		});
		await flushInputRules();

		expect(findCodeBlock(editor)?.attrs.language).toBe('typescript');
	});

	it('passes an unknown language through as-is', async () => {
		editor = createEditor();
		editor.commands.insertContent('```foobar\n', { applyInputRules: true });
		await flushInputRules();

		expect(findCodeBlock(editor)?.attrs.language).toBe('foobar');
	});

	it('still produces a code block when no language is supplied', async () => {
		editor = createEditor();
		editor.commands.insertContent('```\n', { applyInputRules: true });
		await flushInputRules();

		const block = findCodeBlock(editor);

		expect(block).not.toBeNull();
		// upstream tiptap stores `null` for an absent capture; we normalize
		// the empty / undefined input to the empty string.
		expect(block?.attrs.language ?? '').toBe('');
	});
});
