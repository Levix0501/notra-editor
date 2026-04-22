import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface PopoverProps {
	trigger: ReactNode;
	children: ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function Popover({ trigger, children, open, onOpenChange }: PopoverProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Close on click outside
	useEffect(() => {
		if (!open) return;

		const handleMouseDown = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				onOpenChange(false);
			}
		};

		document.addEventListener('mousedown', handleMouseDown);
		return () => document.removeEventListener('mousedown', handleMouseDown);
	}, [open, onOpenChange]);

	// Close on Escape key
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onOpenChange(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [open, onOpenChange]);

	return (
		<div ref={containerRef} className="tiptap-popover">
			{trigger}
			{open && (
				<div
					className="tiptap-popover-content"
					data-state={open ? 'open' : 'closed'}
				>
					{children}
				</div>
			)}
		</div>
	);
}
