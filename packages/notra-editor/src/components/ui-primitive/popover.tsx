import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { ReactNode } from 'react';

export interface PopoverProps {
	trigger: ReactNode;
	children: ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function Popover({
	trigger,
	children,
	open,
	onOpenChange
}: PopoverProps) {
	const triggerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	// Compute position from trigger bounding rect
	useEffect(() => {
		if (!open || !triggerRef.current) return;

		const updatePosition = () => {
			if (!triggerRef.current) return;

			const rect = triggerRef.current.getBoundingClientRect();

			setPosition({
				top: rect.bottom + 4,
				left: rect.left + rect.width / 2
			});
		};

		updatePosition();

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [open]);

	// Close on click outside
	useEffect(() => {
		if (!open) return;

		const handleMouseDown = (event: MouseEvent) => {
			const target = event.target as Node;

			if (
				triggerRef.current?.contains(target) ||
				contentRef.current?.contains(target)
			) {
				return;
			}

			onOpenChange(false);
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
		<>
			<div ref={triggerRef}>{trigger}</div>
			{open &&
				createPortal(
					<div className="notra-editor">
						<div
							ref={contentRef}
							className="tiptap-popover-content"
							data-state="open"
							style={{
								position: 'fixed',
								top: position.top,
								left: position.left
							}}
						>
							{children}
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
