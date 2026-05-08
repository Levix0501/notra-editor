'use client';

import { CornerDownLeft, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Separator } from '../ui/separator.js';

export interface ImageInputFormProps {
	initialUrl?: string;
	initialAlt?: string;
	showRemove?: boolean;
	onSubmit: (values: { url: string; alt: string }) => void;
	onRemove?: () => void;
	onCancel?: () => void;
}

export function ImageInputForm({
	initialUrl = '',
	initialAlt = '',
	showRemove = false,
	onSubmit,
	onRemove,
	onCancel
}: ImageInputFormProps) {
	const [url, setUrl] = useState(initialUrl);
	const [alt, setAlt] = useState(initialAlt);

	useEffect(() => {
		setUrl(initialUrl);
	}, [initialUrl]);

	useEffect(() => {
		setAlt(initialAlt);
	}, [initialAlt]);

	const submit = useCallback(() => {
		onSubmit({ url, alt });
	}, [url, alt, onSubmit]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				submit();

				return;
			}

			if (event.key === 'Escape' && onCancel) {
				event.preventDefault();
				onCancel();
			}
		},
		[submit, onCancel]
	);

	const submitDisabled = !url && !showRemove;

	return (
		<div className="nt:flex nt:w-72 nt:flex-col nt:gap-1 nt:p-1">
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
					disabled={submitDisabled}
					size="icon-sm"
					tabIndex={-1}
					type="button"
					variant="ghost"
					onClick={submit}
				>
					<CornerDownLeft />
				</Button>
				{showRemove && onRemove && (
					<>
						<Separator className="nt:h-5" orientation="vertical" />
						<Button
							aria-label="Remove image"
							size="icon-sm"
							tabIndex={-1}
							type="button"
							variant="ghost"
							onClick={onRemove}
						>
							<Trash2 />
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
