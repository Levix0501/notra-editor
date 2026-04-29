import type { Editor, Range } from '@tiptap/react';

type IconProps = React.SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => React.ReactElement;

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
