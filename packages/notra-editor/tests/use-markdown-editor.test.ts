import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMarkdownEditor } from '../src/hooks/use-markdown-editor';

import type { MarkdownStorage } from 'tiptap-markdown';

function getMarkdownFromEditor(
	editor: { storage: unknown } | null | undefined
): string {
	if (!editor) return '';

	const storage = editor.storage as Record<string, MarkdownStorage>;

	return storage.markdown.getMarkdown();
}

describe('useMarkdownEditor', () => {
	it('returns an editor instance', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '# Hello', onChange })
		);

		expect(result.current.editor).not.toBeNull();
	});

	it('initializes editor content from value prop', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '# Hello', onChange })
		);
		const md = getMarkdownFromEditor(result.current.editor);

		expect(md.trim()).toBe('# Hello');
	});

	it('calls onChange when editor content changes', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMarkdownEditor({ value: '', onChange })
		);

		act(() => {
			result.current.editor?.commands.setContent('<p>new content</p>');
		});

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];

		expect(lastCall).toContain('new content');
	});

	it('updates editor when value prop changes externally', () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ value }) => useMarkdownEditor({ value, onChange }),
			{ initialProps: { value: '# Hello' } }
		);

		rerender({ value: '## New Heading' });

		const md = getMarkdownFromEditor(result.current.editor);

		expect(md.trim()).toBe('## New Heading');
	});
});
