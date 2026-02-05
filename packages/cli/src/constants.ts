export const CONSTANTS = {
	TARGET_DIR: 'components/notra-editor',
	REGISTRY_BASE_URL:
		'https://raw.githubusercontent.com/levix0501/notra-editor/main/public/r',
	COMPONENT_NAME: 'editor'
} as const;

export type Constants = typeof CONSTANTS;
