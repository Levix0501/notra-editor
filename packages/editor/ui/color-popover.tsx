import { Ban, Baseline, Check } from 'lucide-react';
import { useState } from 'react';

import { useColorPopover } from '../hooks/use-color-popover';
import { useTranslation } from '../i18n';
import {
	HIGHLIGHT_COLOR_PRESETS,
	TEXT_COLOR_PRESETS
} from '../lib/color-presets';
import { cn } from '../lib/utils';
import { Button } from './primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from './primitives/popover';

import type { UseColorPopoverConfig } from '../hooks/use-color-popover';
import type { ColorPreset } from '../lib/color-presets';

function ColorSwatch({
	preset,
	isActive,
	isTextColor,
	onClick
}: {
	preset: ColorPreset;
	isActive: boolean;
	isTextColor: boolean;
	onClick: () => void;
}) {
	return (
		<button
			aria-label={preset.label}
			aria-pressed={isActive}
			className={cn(
				'flex size-6 items-center justify-center rounded-full',
				'border border-transparent transition-colors',
				'hover:border-foreground/30',
				isActive && 'border-foreground/50'
			)}
			style={{ backgroundColor: preset.value }}
			type="button"
			onClick={onClick}
		>
			{isActive && (
				<Check
					className={cn(
						'size-3.5',
						isTextColor ? 'text-white' : 'text-foreground'
					)}
				/>
			)}
		</button>
	);
}

function RemoveColorButton({
	label,
	onClick
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			aria-label={label}
			className={cn(
				'flex size-6 items-center justify-center rounded-full',
				'border border-dashed border-foreground/20 transition-colors',
				'hover:border-foreground/40 hover:bg-accent'
			)}
			type="button"
			onClick={onClick}
		>
			<Ban className="size-3.5 text-muted-foreground" />
		</button>
	);
}

function ColorSection({
	title,
	presets,
	activeColor,
	isTextColor,
	removeLabel,
	onSelectColor,
	onRemoveColor
}: {
	title: string;
	presets: ColorPreset[];
	activeColor: string | null;
	isTextColor: boolean;
	removeLabel: string;
	onSelectColor: (color: string) => void;
	onRemoveColor: () => void;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium text-muted-foreground">{title}</span>
			<div className="flex flex-wrap gap-1">
				{presets.map((preset) => (
					<ColorSwatch
						key={preset.value}
						isActive={activeColor === preset.value}
						isTextColor={isTextColor}
						preset={preset}
						onClick={() => onSelectColor(preset.value)}
					/>
				))}
				<RemoveColorButton label={removeLabel} onClick={onRemoveColor} />
			</div>
		</div>
	);
}

// i18n keys will be added in task 5; fallback to English until then
function t(dict: Record<string, unknown>, key: string, fallback: string) {
	const val = dict[key];

	return typeof val === 'string' ? val : fallback;
}

export type ColorPopoverProps = UseColorPopoverConfig;

export function ColorPopover(props: ColorPopoverProps) {
	const [open, setOpen] = useState(false);
	const dictionary = useTranslation();
	const dict = dictionary as unknown as Record<string, unknown>;

	const {
		isVisible,
		canSetColor,
		activeTextColor,
		activeHighlightColor,
		setTextColor,
		removeTextColor,
		setHighlightColor,
		removeHighlightColor
	} = useColorPopover(props);

	if (!isVisible) {
		return null;
	}

	const selectTextColor = (color: string) => {
		setTextColor(color);
		setOpen(false);
	};

	const selectHighlightColor = (color: string) => {
		setHighlightColor(color);
		setOpen(false);
	};

	const clearTextColor = () => {
		removeTextColor();
		setOpen(false);
	};

	const clearHighlightColor = () => {
		removeHighlightColor();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					aria-label={t(dict, 'color.button.ariaLabel', 'Text color')}
					disabled={!canSetColor}
					size="icon-xs"
					variant="ghost"
					onMouseDown={(e) => e.preventDefault()}
				>
					<div className="flex flex-col items-center gap-0">
						<Baseline className="size-3.5" />
						<div
							className="h-0.5 w-3.5 rounded-full"
							style={{
								backgroundColor: activeTextColor ?? 'currentColor'
							}}
						/>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-3">
				<div className="flex flex-col gap-3">
					<ColorSection
						isTextColor
						activeColor={activeTextColor}
						presets={TEXT_COLOR_PRESETS}
						removeLabel={t(dict, 'color.removeTextColor', 'Remove text color')}
						title={t(dict, 'color.textColor', 'Text Color')}
						onRemoveColor={clearTextColor}
						onSelectColor={selectTextColor}
					/>
					<ColorSection
						activeColor={activeHighlightColor}
						isTextColor={false}
						presets={HIGHLIGHT_COLOR_PRESETS}
						removeLabel={t(
							dict,
							'color.removeBackgroundColor',
							'Remove background color'
						)}
						title={t(dict, 'color.backgroundColor', 'Background Color')}
						onRemoveColor={clearHighlightColor}
						onSelectColor={selectHighlightColor}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
