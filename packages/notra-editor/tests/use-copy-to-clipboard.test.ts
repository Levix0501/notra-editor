import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCopyToClipboard } from '../src/hooks/use-copy-to-clipboard';

describe('useCopyToClipboard', () => {
	beforeEach(() => {
		Object.assign(navigator, {
			clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
		});
	});

	it('initializes with isCopied=false', () => {
		const { result } = renderHook(() => useCopyToClipboard());

		expect(result.current.isCopied).toBe(false);
	});

	it('writes to clipboard and toggles isCopied to true', async () => {
		const { result } = renderHook(() => useCopyToClipboard());

		await act(async () => {
			result.current.copyToClipboard('hello');
		});

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
		await waitFor(() => expect(result.current.isCopied).toBe(true));
	});

	it('resets isCopied to false after the timeout elapses', async () => {
		const { result } = renderHook(() => useCopyToClipboard({ timeout: 50 }));

		await act(async () => {
			result.current.copyToClipboard('hi');
		});

		await waitFor(() => expect(result.current.isCopied).toBe(true));
		await waitFor(() => expect(result.current.isCopied).toBe(false), {
			timeout: 500
		});
	});

	it('does nothing when value is an empty string', () => {
		const { result } = renderHook(() => useCopyToClipboard());

		act(() => {
			result.current.copyToClipboard('');
		});

		expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
	});

	it('invokes onCopy callback after a successful copy', async () => {
		const onCopy = vi.fn();
		const { result } = renderHook(() => useCopyToClipboard({ onCopy }));

		await act(async () => {
			result.current.copyToClipboard('hi');
		});

		await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
	});
});
