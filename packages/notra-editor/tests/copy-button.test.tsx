import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from '../src/components/copy-button';

describe('CopyButton', () => {
	beforeEach(() => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
		});
	});

	it('renders a button with an accessible "Copy" label', () => {
		render(<CopyButton value="hello" />);

		expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
	});

	it('writes the value to clipboard on click', () => {
		render(<CopyButton value="hello world" />);

		fireEvent.click(screen.getByRole('button'));

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
	});

	it('swaps the icon to a Check after a successful copy', async () => {
		const { container } = render(<CopyButton value="hi" />);

		expect(container.querySelector('.lucide-copy')).toBeInTheDocument();
		expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button'));

		await waitFor(() =>
			expect(container.querySelector('.lucide-check')).toBeInTheDocument()
		);
	});

	it('forwards a custom className to the underlying Button', () => {
		render(<CopyButton className="my-extra-class" value="" />);

		expect(screen.getByRole('button').className).toMatch(/my-extra-class/);
	});
});
