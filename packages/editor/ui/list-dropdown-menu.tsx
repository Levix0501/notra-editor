import { ChevronDown } from 'lucide-react';

import { ListButton } from './list-button';
import { useListDropdownMenu } from '../hooks/use-list-dropdown-menu';
import { useTranslation } from '../i18n';
import { Button } from './primitives/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from './primitives/dropdown-menu';

export function ListDropdownMenu() {
	const dictionary = useTranslation();
	const { isVisible, isActive, canToggle, Icon, filteredLists } =
		useListDropdownMenu();

	if (!isVisible) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={dictionary['list.dropdown.ariaLabel']}
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
				{filteredLists.map((list) => (
					<ListButton key={list.type} type={list.type} />
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
