import { NodeSelection } from '@tiptap/pm/state';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Editor } from '@tiptap/core';
import type { Node as TiptapNode } from '@tiptap/pm/model';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isExtensionAvailable(
	editor: Editor | null,
	extensionNames: string | string[]
): boolean {
	if (!editor) return false;

	const names = Array.isArray(extensionNames)
		? extensionNames
		: [extensionNames];

	const found = names.some((name) =>
		editor.extensionManager.extensions.some((ext) => ext.name === name)
	);

	if (!found) {
		console.warn(
			`None of the extensions [${names.join(', ')}] were found in the editor schema. Ensure they are included in the editor configuration.`
		);
	}

	return found;
}

export function isNodeInSchema(
	nodeName: string,
	editor: Editor | null
): boolean {
	if (!editor?.schema) return false;

	return editor.schema.spec.nodes.get(nodeName) !== undefined;
}

export function isMarkInSchema(
	markName: string,
	editor: Editor | null
): boolean {
	if (!editor?.schema) return false;

	return editor.schema.spec.marks.get(markName) !== undefined;
}

export function isNodeTypeSelected(
	editor: Editor | null,
	types: string[] = []
): boolean {
	if (!editor || !editor.state.selection) return false;

	const { state } = editor;
	const { selection } = state;

	if (selection.empty) return false;

	if (selection instanceof NodeSelection) {
		const node = selection.node;

		return node ? types.includes(node.type.name) : false;
	}

	return false;
}

export function isValidPosition(pos: number | null | undefined): pos is number {
	return typeof pos === 'number' && pos >= 0;
}

export function findNodeAtPosition(editor: Editor, position: number) {
	try {
		const node = editor.state.doc.nodeAt(position);

		if (!node) {
			console.warn(`No node found at position ${position}`);

			return null;
		}

		return node;
	} catch (error) {
		console.error(`Error getting node at position ${position}:`, error);

		return null;
	}
}

export function findNodePosition(props: {
	editor: Editor | null;
	node?: TiptapNode | null;
	nodePos?: number | null;
}): { pos: number; node: TiptapNode } | null {
	const { editor, node, nodePos } = props;

	if (!editor || !editor.state?.doc) return null;

	const hasValidNode = node !== undefined && node !== null;
	const hasValidPos = isValidPosition(nodePos);

	if (!hasValidNode && !hasValidPos) {
		return null;
	}

	if (hasValidNode) {
		let foundPos = -1;
		let foundNode: TiptapNode | null = null;

		editor.state.doc.descendants((currentNode, pos) => {
			if (currentNode === node) {
				foundPos = pos;
				foundNode = currentNode;

				return false;
			}

			return true;
		});

		if (foundPos !== -1 && foundNode !== null) {
			return { pos: foundPos, node: foundNode };
		}
	}

	if (hasValidPos) {
		const nodeAtPos = findNodeAtPosition(editor, nodePos!);

		if (nodeAtPos) {
			return { pos: nodePos!, node: nodeAtPos };
		}
	}

	return null;
}

type ProtocolOptions = {
	scheme: string;
	optionalSlashes?: boolean;
};

type ProtocolConfig = Array<ProtocolOptions | string>;

// Strip invisible Unicode whitespace that can bypass protocol detection

const ATTR_WHITESPACE =
	/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

export function isAllowedUri(
	uri: string | undefined,
	protocols?: ProtocolConfig
): boolean {
	const allowedProtocols: string[] = [
		'http',
		'https',
		'ftp',
		'ftps',
		'mailto',
		'tel',
		'callto',
		'sms',
		'cid',
		'xmpp'
	];

	if (protocols) {
		protocols.forEach((protocol) => {
			const nextProtocol =
				typeof protocol === 'string' ? protocol : protocol.scheme;

			if (nextProtocol) {
				allowedProtocols.push(nextProtocol);
			}
		});
	}

	return (
		!uri ||
		!!uri
			.replace(ATTR_WHITESPACE, '')
			.match(
				new RegExp(
					`^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`,
					'i'
				)
			)
	);
}

export function sanitizeUrl(
	inputUrl: string,
	baseUrl: string,
	protocols?: ProtocolConfig
): string {
	try {
		const url = new URL(inputUrl, baseUrl);

		if (isAllowedUri(url.href, protocols)) {
			return url.href;
		}
	} catch {
		// Invalid URL
	}

	return '#';
}
