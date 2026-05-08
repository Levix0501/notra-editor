'use client';

import { Check, Copy } from 'lucide-react';

import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard.js';
import { Button } from './ui/button.js';

interface CopyButtonProps {
	value: string;
	className?: string;
}

export const CopyButton = ({ value, className }: CopyButtonProps) => {
	const { isCopied, copyToClipboard } = useCopyToClipboard();

	return (
		<Button
			className={className}
			size="icon"
			variant="ghost"
			onClick={() => copyToClipboard(value)}
		>
			<span className="nt:sr-only">Copy</span>
			{isCopied ? <Check /> : <Copy />}
		</Button>
	);
};
