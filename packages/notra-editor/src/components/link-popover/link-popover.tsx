import {
	CornerDownLeft,
	ExternalLink,
	Link as LinkIcon,
	Trash2
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { useLinkPopover } from './use-link-popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';

import type { Editor } from '@tiptap/core';

export interface LinkPopoverProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'type'
> {
	editor: Editor | null;
}

export const LinkPopover = forwardRef<HTMLButtonElement, LinkPopoverProps>(
	({ editor, ...buttonProps }, ref) => {
		const [isOpen, setIsOpen] = useState(false);

		const { url, setUrl, isActive, canSet, setLink, removeLink, openLink } =
			useLinkPopover({ editor });

		// Auto-open popover when a link becomes active
		useEffect(() => {
			if (isActive) {
				setIsOpen(true);
			}
		}, [isActive]);

		const handleSetLink = useCallback(() => {
			setLink();
			setIsOpen(false);
		}, [setLink]);

		const handleRemoveLink = useCallback(() => {
			removeLink();
			setIsOpen(false);
		}, [removeLink]);

		const handleKeyDown = useCallback(
			(event: React.KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					handleSetLink();
				}
			},
			[handleSetLink]
		);

		return (
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						ref={ref}
						aria-label="Link"
						aria-pressed={isActive}
						data-active-state={isActive ? 'on' : 'off'}
						disabled={!canSet}
						size="icon"
						tabIndex={-1}
						type="button"
						variant="ghost"
						{...buttonProps}
					>
						<LinkIcon
							className={
								isActive ? 'nt:text-[var(--tt-brand-color-500)]' : undefined
							}
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="nt:flex nt:w-auto nt:items-center nt:gap-1 nt:p-1"
				>
					<Input
						autoFocus
						className="nt:h-7 nt:min-w-48 nt:border-none nt:shadow-none nt:focus-visible:ring-0"
						placeholder="Paste a link..."
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<Button
						aria-label="Apply link"
						disabled={!url && !isActive}
						size="icon-sm"
						tabIndex={-1}
						type="button"
						variant="ghost"
						onClick={handleSetLink}
					>
						<CornerDownLeft />
					</Button>
					<Separator className="nt:h-5" orientation="vertical" />
					<Button
						aria-label="Open link in new window"
						size="icon-sm"
						tabIndex={-1}
						type="button"
						variant="ghost"
						onClick={openLink}
					>
						<ExternalLink />
					</Button>
					<Button
						aria-label="Remove link"
						size="icon-sm"
						tabIndex={-1}
						type="button"
						variant="ghost"
						onClick={handleRemoveLink}
					>
						<Trash2 />
					</Button>
				</PopoverContent>
			</Popover>
		);
	}
);

LinkPopover.displayName = 'LinkPopover';
