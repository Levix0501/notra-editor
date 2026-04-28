import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LanguageSelect } from '../src/components/code-block-view/language-select';

describe('LanguageSelect', () => {
	it('renders the current language label on the trigger', () => {
		render(<LanguageSelect language="typescript" onLanguageChange={vi.fn()} />);

		expect(
			screen.getByRole('button', { name: /typescript/i })
		).toBeInTheDocument();
	});

	it('renders "Auto" when language is the empty string', () => {
		render(<LanguageSelect language="" onLanguageChange={vi.fn()} />);

		expect(screen.getByRole('button', { name: /auto/i })).toBeInTheDocument();
	});

	it('renders "Auto" when language is the literal "auto"', () => {
		render(<LanguageSelect language="auto" onLanguageChange={vi.fn()} />);

		expect(screen.getByRole('button', { name: /auto/i })).toBeInTheDocument();
	});

	it('opens the popover and lists languages on trigger click', () => {
		render(<LanguageSelect language="auto" onLanguageChange={vi.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: /auto/i }));

		expect(screen.getByPlaceholderText(/search language/i)).toBeInTheDocument();
		expect(screen.getByText('TypeScript')).toBeInTheDocument();
		expect(screen.getByText('Python')).toBeInTheDocument();
	});

	it('calls onLanguageChange with the value when an item is clicked', () => {
		const onChange = vi.fn();

		render(<LanguageSelect language="auto" onLanguageChange={onChange} />);

		fireEvent.click(screen.getByRole('button', { name: /auto/i }));
		fireEvent.click(screen.getByText('TypeScript'));

		expect(onChange).toHaveBeenCalledWith('typescript');
	});
});
