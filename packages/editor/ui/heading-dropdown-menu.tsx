import { ChevronDown } from 'lucide-react';

import { HeadingButton } from './heading-button';
import { useHeadingDropdownMenu } from '../hooks/use-heading-dropdown-menu';
import { Button } from './primitives/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from './primitives/dropdown-menu';

export function HeadingDropdownMenu() {
	const { isVisible, isActive, canToggle, Icon, levels } =
		useHeadingDropdownMenu({
			levels: [1, 2, 3, 4, 5, 6]
		});

	if (!isVisible) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label="Format text as heading"
					aria-pressed={isActive}
					data-active-state={isActive ? 'on' : 'off'}
					data-disabled={!canToggle}
					data-style="ghost"
					disabled={!canToggle}
					isActive={isActive}
					size="xs"
					tabIndex={-1}
					variant="ghost"
				>
					<Icon />
					<ChevronDown className="size-2.5" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{levels.map((level) => (
					<HeadingButton key={`heading-${level}`} level={level} />
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
