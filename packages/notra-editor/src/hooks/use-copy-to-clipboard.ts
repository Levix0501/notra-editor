'use client';

import { useState } from 'react';

interface UseCopyToClipboardOptions {
	timeout?: number;
	onCopy?: () => void;
}

export const useCopyToClipboard = ({
	timeout = 2000,
	onCopy
}: UseCopyToClipboardOptions = {}) => {
	const [isCopied, setIsCopied] = useState(false);

	const copyToClipboard = (value: string) => {
		if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
			return;
		}

		if (!value) return;

		navigator.clipboard.writeText(value).then(() => {
			setIsCopied(true);
			onCopy?.();

			setTimeout(() => {
				setIsCopied(false);
			}, timeout);
		}, console.error);
	};

	return { isCopied, copyToClipboard };
};
