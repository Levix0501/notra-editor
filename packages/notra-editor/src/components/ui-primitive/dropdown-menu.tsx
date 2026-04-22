import { useEffect, useRef, useState } from 'react';
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
	onOpenChange,
}: DropdownMenuProps) {
	const isControlled = controlledOpen !== undefined;
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const containerRef = useRef<HTMLDivElement>(null);

	const setOpen = (value: boolean) => {
		if (!isControlled) {
			setUncontrolledOpen(value);
		}
		onOpenChange?.(value);
	};

	// Close on click outside
	useEffect(() => {
		if (!open) return;

		const handleMouseDown = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
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
		<div ref={containerRef} className="tiptap-dropdown-menu">
			<div onClick={() => setOpen(!open)}>{trigger}</div>
			{open && (
				<div
					className="tiptap-dropdown-menu-content"
					role="menu"
					data-state={open ? 'open' : 'closed'}
				>
					<div
						className="tiptap-dropdown-menu-group"
						onClick={() => setOpen(false)}
					>
						{children}
					</div>
				</div>
			)}
		</div>
	);
}
