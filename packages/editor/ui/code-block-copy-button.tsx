import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from './primitives/button';

interface CopyButtonProps {
	value: string;
}

export function CopyButton({ value }: Readonly<CopyButtonProps>) {
	const [isCopied, setIsCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const handleCopy = useCallback(() => {
		if (!value) return;

		navigator.clipboard.writeText(value).then(
			() => {
				setIsCopied(true);

				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(() => {
					setIsCopied(false);
					timeoutRef.current = null;
				}, 2000);
			},
			() => {
				// Clipboard API error — silently ignore
			}
		);
	}, [value]);

	return (
		<Button size="icon-xs" variant="ghost" onClick={handleCopy}>
			<span className="sr-only">Copy</span>
			{isCopied ? <Check /> : <Copy />}
		</Button>
	);
}
