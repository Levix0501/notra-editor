'use client';

import {
	CornerDownLeft,
	ImageIcon,
	Trash2
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { useImagePopover } from './use-image-popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';

import type { Editor } from '@tiptap/core';

export interface ImagePopoverProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
	editor: Editor | null;
}

export const ImagePopover = forwardRef<HTMLButtonElement, ImagePopoverProps>(
	({ editor, ...buttonProps }, ref) => {
		const [isOpen, setIsOpen] = useState(false);

		const {
			url,
			setUrl,
			alt,
			setAlt,
			isActive,
			canSet,
			setImage,
			removeImage
		} = useImagePopover({ editor });

		// Auto-open popover when an image becomes active (mirrors LinkPopover)
		useEffect(() => {
			if (isActive) {
				setIsOpen(true);
			}
		}, [isActive]);

		const handleSetImage = useCallback(() => {
			setImage();
			setIsOpen(false);
		}, [setImage]);

		const handleRemoveImage = useCallback(() => {
			removeImage();
			setIsOpen(false);
		}, [removeImage]);

		const handleKeyDown = useCallback(
			(event: React.KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					handleSetImage();
				}
			},
			[handleSetImage]
		);

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
				<PopoverContent
					align="start"
					className="nt:flex nt:w-72 nt:flex-col nt:gap-1 nt:p-1"
				>
					<Input
						autoFocus
						className="nt:h-7 nt:border-none nt:shadow-none nt:focus-visible:ring-0"
						placeholder="Paste image URL..."
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<Input
						className="nt:h-7 nt:border-none nt:shadow-none nt:focus-visible:ring-0"
						placeholder="Alt text (optional)"
						type="text"
						value={alt}
						onChange={(e) => setAlt(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<div className="nt:flex nt:items-center nt:justify-end nt:gap-1">
						<Button
							aria-label="Apply image"
							disabled={!url && !isActive}
							size="icon-sm"
							tabIndex={-1}
							type="button"
							variant="ghost"
							onClick={handleSetImage}
						>
							<CornerDownLeft />
						</Button>
						{isActive && (
							<>
								<Separator className="nt:h-5" orientation="vertical" />
								<Button
									aria-label="Remove image"
									size="icon-sm"
									tabIndex={-1}
									type="button"
									variant="ghost"
									onClick={handleRemoveImage}
								>
									<Trash2 />
								</Button>
							</>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	}
);

ImagePopover.displayName = 'ImagePopover';
