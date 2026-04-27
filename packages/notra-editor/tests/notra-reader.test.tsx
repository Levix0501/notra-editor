import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotraReader } from '../src/notra-reader';

describe('NotraReader', () => {
	it('renders the reader container', () => {
		const { container } = render(<NotraReader content="# Hello" />);

		expect(container.querySelector('.notra-reader')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<NotraReader className="custom" content="# Hello" />
		);

		expect(container.querySelector('.notra-reader.custom')).toBeInTheDocument();
	});

	it('renders heading from markdown', () => {
		render(<NotraReader content="# Hello World" />);
		expect(screen.getByText('Hello World')).toBeInTheDocument();
	});

	it('renders bold text from markdown', () => {
		const { container } = render(<NotraReader content="**bold text**" />);
		const strong = container.querySelector('strong');

		expect(strong).toBeInTheDocument();
		expect(strong).toHaveTextContent('bold text');
	});

	it('renders links from markdown', () => {
		render(<NotraReader content="[click here](https://example.com)" />);
		const link = screen.getByRole('link', { name: 'click here' });

		expect(link).toHaveAttribute('href', 'https://example.com');
	});

	it('renders code blocks with a copy button', () => {
		const { container } = render(
			<NotraReader content={'```\nconsole.log("hi")\n```'} />
		);
		const pre = container.querySelector('pre');

		expect(pre).toBeInTheDocument();
		expect(pre?.querySelector('button')).not.toBeNull();
		expect(
			pre?.querySelector('button')?.querySelector('.lucide-copy')
		).toBeInTheDocument();
		expect(pre).toHaveTextContent('console.log("hi")');
	});
});
