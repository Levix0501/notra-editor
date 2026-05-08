'use client';

import { useCallback } from 'react';

import { ImageInputForm } from '../image-popover/image-input-form.js';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover.js';

import type { Editor } from '@tiptap/core';
import type {} from '@tiptap/extension-image';

export interface SlashImagePopoverProps {
	editor: Editor;
	anchorRect: DOMRect;
	onClose: () => void;
}

export function SlashImagePopover({
	editor,
	anchorRect,
	onClose
}: SlashImagePopoverProps) {
	const handleSubmit = useCallback(
		({ url, alt }: { url: string; alt: string }) => {
			if (!url) {
				onClose();

				return;
			}

			editor
				.chain()
				.focus()
				.setImage({ src: url, alt: alt || undefined })
				.run();
			onClose();
		},
		[editor, onClose]
	);

	return (
		<Popover
			open
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<PopoverAnchor asChild>
				<span
					ref={(node) => {
						if (!node) return;

						// Pin the anchor element at the captured rect.
						const { top, left, width, height } = anchorRect;

						node.style.position = 'fixed';
						node.style.top = `${top}px`;
						node.style.left = `${left}px`;
						node.style.width = `${width || 1}px`;
						node.style.height = `${height || 1}px`;
						node.style.pointerEvents = 'none';
					}}
					aria-hidden
				/>
			</PopoverAnchor>
			<PopoverContent align="start" className="nt:w-auto nt:p-0">
				<ImageInputForm onCancel={onClose} onSubmit={handleSubmit} />
			</PopoverContent>
		</Popover>
	);
}
