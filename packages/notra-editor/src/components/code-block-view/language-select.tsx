import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

import { LANGUAGES, getLanguageLabel } from '../../lib/languages';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export interface LanguageSelectProps {
	/** Current language value (e.g. "typescript"); empty / "auto" → "Auto" label */
	language: string;
	/** Called with the new value when the user picks a language */
	onLanguageChange: (language: string) => void;
}

export const LanguageSelect = ({
	language,
	onLanguageChange
}: LanguageSelectProps) => {
	const [open, setOpen] = useState(false);
	const current = language || 'auto';
	const label = getLanguageLabel(current);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
				<Button
					aria-expanded={open}
					className="nt:h-7 nt:gap-1 nt:px-2 nt:text-xs"
					size="sm"
					tabIndex={-1}
					type="button"
					variant="ghost"
				>
					{label}
					<ChevronDownIcon className="nt:size-3 nt:opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="nt:w-[200px] nt:p-0">
				<Command>
					<CommandInput placeholder="Search language..." />
					<CommandList>
						<CommandEmpty>No language found.</CommandEmpty>
						<CommandGroup>
							{LANGUAGES.map((item) => (
								<CommandItem
									key={item.value}
									value={item.value}
									onSelect={(value) => {
										onLanguageChange(value);
										setOpen(false);
									}}
								>
									{item.label}
									<CheckIcon
										className={cn(
											'nt:ml-auto nt:size-4',
											current === item.value ? 'nt:opacity-100' : 'nt:opacity-0'
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
