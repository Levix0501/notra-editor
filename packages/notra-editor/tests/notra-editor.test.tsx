import { render, screen } from '@testing-library/react';
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
			<NotraEditor value="" onChange={vi.fn()} className="custom" />
		);
		expect(container.querySelector('.notra-editor.custom')).toBeInTheDocument();
	});

	it('renders content from value prop', () => {
		render(<NotraEditor value="# Hello" onChange={vi.fn()} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
	});

	it('sets contenteditable to false when readOnly is true', () => {
		const { container } = render(
			<NotraEditor value="# Hello" onChange={vi.fn()} readOnly />
		);
		const prosemirror = container.querySelector('.ProseMirror');
		expect(prosemirror).toHaveAttribute('contenteditable', 'false');
	});
});
