import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { ReactNode } from 'react';

export interface DropdownMenuProps {
	trigger: ReactNode;
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({
	trigger,
	children,
	open: controlledOpen,
	onOpenChange
}: DropdownMenuProps) {
	const isControlled = controlledOpen !== undefined;
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const triggerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const setOpen = (value: boolean) => {
		if (!isControlled) {
			setUncontrolledOpen(value);
		}

		onOpenChange?.(value);
	};

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

			setOpen(false);
		};

		document.addEventListener('mousedown', handleMouseDown);

		return () => document.removeEventListener('mousedown', handleMouseDown);
	}, [open]);

	// Close on Escape key
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [open]);

	return (
		<>
			<div ref={triggerRef} onClick={() => setOpen(!open)}>
				{trigger}
			</div>
			{open &&
				createPortal(
					<div className="notra-editor">
						<div
							ref={contentRef}
							className="tiptap-dropdown-menu-content"
							data-state="open"
							role="menu"
							style={{
								position: 'fixed',
								top: position.top,
								left: position.left
							}}
						>
							<div
								className="tiptap-dropdown-menu-group"
								onClick={() => setOpen(false)}
							>
								{children}
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
