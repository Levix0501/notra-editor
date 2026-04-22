import { forwardRef, useCallback, useEffect, useState } from 'react';

import { useLinkPopover } from './use-link-popover';
import { Button } from '../button/button';
import { ToolbarSeparator } from '../toolbar/toolbar';
import { Card, CardBody, CardItemGroup } from '../ui-primitive/card';
import { Input } from '../ui-primitive/input';
import { Popover } from '../ui-primitive/popover';
import { CornerDownLeftIcon } from '../../icons/corner-down-left-icon';
import { ExternalLinkIcon } from '../../icons/external-link-icon';
import { LinkIcon } from '../../icons/link-icon';
import { TrashIcon } from '../../icons/trash-icon';

import type { Editor } from '@tiptap/core';

export interface LinkPopoverProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
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
			<Popover
				open={isOpen}
				onOpenChange={setIsOpen}
				trigger={
					<Button
						ref={ref}
						aria-label="Link"
						aria-pressed={isActive}
						data-active-state={isActive ? 'on' : 'off'}
						disabled={!canSet}
						tabIndex={-1}
						type="button"
						variant="ghost"
						onClick={() => setIsOpen((prev) => !prev)}
						{...buttonProps}
					>
						<LinkIcon className="tiptap-button-icon" />
					</Button>
				}
			>
				<Card>
					<CardBody>
						<CardItemGroup orientation="horizontal">
							<Input
								autoFocus
								className="tiptap-link-input"
								placeholder="Paste a link..."
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								onKeyDown={handleKeyDown}
							/>
							<Button
								aria-label="Apply link"
								disabled={!url && !isActive}
								tabIndex={-1}
								type="button"
								variant="ghost"
								onClick={handleSetLink}
							>
								<CornerDownLeftIcon className="tiptap-button-icon" />
							</Button>
							<ToolbarSeparator />
							<Button
								aria-label="Open link in new window"
								tabIndex={-1}
								type="button"
								variant="ghost"
								onClick={openLink}
							>
								<ExternalLinkIcon className="tiptap-button-icon" />
							</Button>
							<Button
								aria-label="Remove link"
								tabIndex={-1}
								type="button"
								variant="ghost"
								onClick={handleRemoveLink}
							>
								<TrashIcon className="tiptap-button-icon" />
							</Button>
						</CardItemGroup>
					</CardBody>
				</Card>
			</Popover>
		);
	}
);

LinkPopover.displayName = 'LinkPopover';
