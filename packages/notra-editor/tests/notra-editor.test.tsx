import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotraEditor } from '../src/notra-editor';

describe('NotraEditor', () => {
	it('renders the editor container', () => {
		const { container } = render(
			<NotraEditor value="# Hello" onChange={vi.fn()} />
		);

		expect(container.querySelector('.notra-editor')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<NotraEditor className="custom" value="" onChange={vi.fn()} />
		);

		expect(container.querySelector('.notra-editor.custom')).toBeInTheDocument();
	});

	it('renders content from value prop', () => {
		render(<NotraEditor value="# Hello" onChange={vi.fn()} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Hello'
		);
	});

	it('sets contenteditable to false when readOnly is true', () => {
		const { container } = render(
			<NotraEditor readOnly value="# Hello" onChange={vi.fn()} />
		);
		const prosemirror = container.querySelector('.ProseMirror');

		expect(prosemirror).toHaveAttribute('contenteditable', 'false');
	});

	it('renders a copy button next to code blocks', async () => {
		const { container } = render(
			<NotraEditor value={'```\nconsole.log("hi")\n```'} onChange={vi.fn()} />
		);

		// Wait for editor to initialize
		const pre = await waitFor(() => {
			const element = container.querySelector('pre');

			if (!element) throw new Error('pre not found');

			return element;
		});

		// The header div lives as a sibling of <pre> inside the relative wrapper.
		const wrapper = pre.parentElement;

		expect(pre).toBeInTheDocument();
		expect(wrapper?.querySelector('button')).not.toBeNull();
		expect(
			wrapper?.querySelector('button')?.querySelector('.lucide-copy')
		).toBeInTheDocument();
	});
});

describe('NotraEditor — markdown features', () => {
	it('renders headings from markdown', () => {
		render(<NotraEditor value="## Sub Heading" onChange={vi.fn()} />);
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
			'Sub Heading'
		);
	});

	it('renders unordered lists from markdown', () => {
		const { container } = render(
			<NotraEditor value={'- item one\n- item two'} onChange={vi.fn()} />
		);
		const items = container.querySelectorAll('li');

		expect(items.length).toBe(2);
	});

	it('renders code blocks from markdown', async () => {
		const { container } = render(
			<NotraEditor value={'```\ncode here\n```'} onChange={vi.fn()} />
		);

		const pre = await waitFor(() => {
			const element = container.querySelector('pre');

			if (!element) throw new Error('pre not found');

			return element;
		});

		expect(pre).toBeInTheDocument();
	});

	it('renders blockquotes from markdown', () => {
		const { container } = render(
			<NotraEditor value="> quoted text" onChange={vi.fn()} />
		);

		expect(container.querySelector('blockquote')).toBeInTheDocument();
	});

	it('renders horizontal rules from markdown', () => {
		const { container } = render(
			<NotraEditor value={'text\n\n---\n\nmore text'} onChange={vi.fn()} />
		);

		expect(container.querySelector('hr')).toBeInTheDocument();
	});

	it('renders inline marks from markdown', () => {
		const { container } = render(
			<NotraEditor value="**bold** and *italic*" onChange={vi.fn()} />
		);

		expect(container.querySelector('strong')).toHaveTextContent('bold');
		expect(container.querySelector('em')).toHaveTextContent('italic');
	});
});
