import type { Editor, Range } from '@tiptap/react';

export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface SuggestionItem {
	/** Main label shown in the menu. */
	title: string;
	/** Secondary description shown under the title. */
	subtext?: string;
	/** Icon component (lucide-react). */
	badge?: IconComponent;
	/** Group label used by callers that render grouped lists. */
	group?: string;
	/** Extra search keywords. */
	keywords?: string[];
	/** Invoked when the item is chosen. */
	onSelect: (props: { editor: Editor; range: Range }) => void;
}
