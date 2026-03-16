export interface ColorPreset {
	label: string;
	value: string;
}

export const TEXT_COLOR_PRESETS: ColorPreset[] = [
	{ label: 'gray', value: '#6b7280' },
	{ label: 'brown', value: '#92400e' },
	{ label: 'orange', value: '#ea580c' },
	{ label: 'yellow', value: '#ca8a04' },
	{ label: 'green', value: '#16a34a' },
	{ label: 'blue', value: '#2563eb' },
	{ label: 'purple', value: '#7c3aed' },
	{ label: 'pink', value: '#db2777' },
	{ label: 'red', value: '#dc2626' }
];

export const HIGHLIGHT_COLOR_PRESETS: ColorPreset[] = [
	{ label: 'gray', value: '#f3f4f6' },
	{ label: 'brown', value: '#fef3c7' },
	{ label: 'orange', value: '#ffedd5' },
	{ label: 'yellow', value: '#fef9c3' },
	{ label: 'green', value: '#dcfce7' },
	{ label: 'blue', value: '#dbeafe' },
	{ label: 'purple', value: '#ede9fe' },
	{ label: 'pink', value: '#fce7f3' },
	{ label: 'red', value: '#fee2e2' }
];
