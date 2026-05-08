'use client';

import { ImageIcon } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { ImageInputForm } from './image-input-form.js';
import { useImagePopover } from './use-image-popover.js';
import { Button } from '../ui/button.js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.js';

import type { Editor } from '@tiptap/core';

export interface ImagePopoverProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
}

export const ImagePopover = forwardRef<HTMLButtonElement, ImagePopoverProps>(
	({ editor, ...buttonProps }, ref) => {
		const [isOpen, setIsOpen] = useState(false);

		const { url, alt, isActive, canSet, removeImage, wasSelectionMove } =
			useImagePopover({ editor });

		useEffect(() => {
			if (isActive && wasSelectionMove) {
				setIsOpen(true);
			}
		}, [isActive, wasSelectionMove]);

		// Bypass useImagePopover.setImage — it reads url/alt from hook state,
		// which lags behind the form values when called synchronously after the
		// hook's setUrl/setAlt setters. Submit values directly to the editor.
		const handleSubmit = useCallback(
			(values: { url: string; alt: string }) => {
				if (!editor) return;

				if (!values.url) {
					if (isActive) removeImage();

					setIsOpen(false);

					return;
				}

				editor
					.chain()
					.focus()
					.setImage({
						src: values.url,
						alt: values.alt || undefined
					})
					.run();
				setIsOpen(false);
			},
			[editor, isActive, removeImage]
		);

		const handleRemove = useCallback(() => {
			removeImage();
			setIsOpen(false);
		}, [removeImage]);

		return (
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						ref={ref}
						aria-label="Image"
						aria-pressed={isActive}
						data-active-state={isActive ? 'on' : 'off'}
						disabled={!canSet}
						size="icon"
						tabIndex={-1}
						type="button"
						variant="ghost"
						{...buttonProps}
					>
						<ImageIcon
							className={
								isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
							}
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="nt:w-auto nt:p-0">
					<ImageInputForm
						initialAlt={alt}
						initialUrl={url}
						showRemove={isActive}
						onCancel={() => setIsOpen(false)}
						onRemove={handleRemove}
						onSubmit={handleSubmit}
					/>
				</PopoverContent>
			</Popover>
		);
	}
);

ImagePopover.displayName = 'ImagePopover';
