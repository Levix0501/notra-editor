import {
	Check,
	Copy,
	CornerDownLeft,
	Link,
	Pencil,
	Unlink
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CursorOverlay } from './cursor-overlay';
import { useLinkPopover } from '../hooks/use-link-popover';
import { cn } from '../lib/utils';
import { Button } from './primitives/button';

import type { UseLinkPopoverConfig } from '../hooks/use-link-popover';
import type { FocusEvent as ReactFocusEvent, KeyboardEvent } from 'react';

function LinkPreview({
	url,
	onEdit,
	onUnlink
}: {
	url: string;
	onEdit: () => void;
	onUnlink: () => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	}, [url]);

	return (
		<div className="flex items-center gap-2">
			<a
				className="text-sm text-muted-foreground underline truncate max-w-48"
				href={url}
				rel="noopener noreferrer"
				target="_blank"
			>
				{url}
			</a>
			<div className="flex items-center gap-0.5">
				<Button
					aria-label="Edit link"
					size="icon-xs"
					variant="ghost"
					onClick={onEdit}
				>
					<Pencil size={14} />
				</Button>
				<Button
					aria-label="Copy link"
					size="icon-xs"
					variant="ghost"
					onClick={handleCopy}
				>
					{copied ? <Check size={14} /> : <Copy size={14} />}
				</Button>
				<Button
					aria-label="Unlink"
					size="icon-xs"
					variant="ghost"
					onClick={onUnlink}
				>
					<Unlink size={14} />
				</Button>
			</div>
		</div>
	);
}

function LinkEditForm({
	url,
	text,
	urlError,
	onUrlChange,
	onTextChange,
	onSubmit,
	onClose
}: {
	url: string;
	text: string;
	urlError: string | null;
	onUrlChange: (url: string) => void;
	onTextChange: (text: string) => void;
	onSubmit: () => void;
	onClose: () => void;
}) {
	const urlInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		urlInputRef.current?.focus();
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				onSubmit();
			}

			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		},
		[onSubmit, onClose]
	);

	return (
		<div className="flex flex-col gap-2" onKeyDown={handleKeyDown}>
			<div className="flex items-center gap-1">
				<input
					ref={urlInputRef}
					aria-invalid={!!urlError}
					aria-label="URL"
					className={cn(
						'flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none',
						'focus:ring-2 focus:ring-ring/50',
						urlError && 'border-destructive'
					)}
					placeholder="https://example.com"
					type="url"
					value={url}
					onChange={(e) => onUrlChange(e.target.value)}
				/>
				<Button
					aria-label="Confirm"
					size="icon-xs"
					variant="ghost"
					onClick={onSubmit}
				>
					<CornerDownLeft size={14} />
				</Button>
			</div>
			{urlError && (
				<p className="text-xs text-destructive" role="alert">
					{urlError}
				</p>
			)}
			<input
				aria-label="Display text"
				className={cn(
					'rounded-md border bg-transparent px-2 py-1 text-sm outline-none',
					'focus:ring-2 focus:ring-ring/50'
				)}
				placeholder="Display text"
				value={text}
				onChange={(e) => onTextChange(e.target.value)}
			/>
		</div>
	);
}

export type LinkPopoverProps = UseLinkPopoverConfig;

export function LinkPopover(props: LinkPopoverProps) {
	const {
		editor,
		isVisible,
		canSetLink,
		isActive,
		popoverMode,
		setPopoverMode,
		url,
		setUrl,
		text,
		setText,
		urlError,
		submitLink,
		removeLink,
		anchorCoords
	} = useLinkPopover(props);

	const panelRef = useRef<HTMLDivElement>(null);

	const isOpen = popoverMode !== 'closed';

	const handlePanelFocusOut = useCallback(
		(e: ReactFocusEvent) => {
			if (popoverMode !== 'edit') return;

			// Stay open when focus moves within the panel (e.g. URL → text input)
			if (panelRef.current?.contains(e.relatedTarget as Node)) return;

			setPopoverMode('closed');
		},
		[popoverMode, setPopoverMode]
	);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
			if (e.key === 'Escape') {
				setPopoverMode('closed');
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, setPopoverMode]);

	if (!isVisible) {
		return null;
	}

	const handleTriggerClick = () => {
		// Toolbar button has no effect when popover is already open
		if (isOpen) return;

		if (isActive) {
			setPopoverMode('preview');
		} else {
			setPopoverMode('edit');
		}
	};

	return (
		<>
			<Button
				aria-label="Link"
				disabled={!canSetLink}
				isActive={isActive}
				size="icon-xs"
				tabIndex={-1}
				variant="ghost"
				onClick={handleTriggerClick}
				onMouseDown={(e) => e.preventDefault()}
			>
				<Link size={16} />
			</Button>

			{isOpen && editor && <CursorOverlay editor={editor} />}

			{isOpen &&
				anchorCoords &&
				createPortal(
					<div
						ref={panelRef}
						className="bg-popover text-popover-foreground z-50 w-auto rounded-md border p-3 shadow-md"
						style={{
							position: 'fixed',
							left: anchorCoords.left,
							top: anchorCoords.top + 4
						}}
						onBlur={handlePanelFocusOut}
					>
						{popoverMode === 'preview' && (
							<LinkPreview
								url={url}
								onEdit={() => setPopoverMode('edit')}
								onUnlink={removeLink}
							/>
						)}
						{popoverMode === 'edit' && (
							<LinkEditForm
								text={text}
								url={url}
								urlError={urlError}
								onClose={() => setPopoverMode('closed')}
								onSubmit={submitLink}
								onTextChange={setText}
								onUrlChange={setUrl}
							/>
						)}
					</div>,
					document.body
				)}
		</>
	);
}
