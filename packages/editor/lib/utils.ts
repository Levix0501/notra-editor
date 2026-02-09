import { NodeSelection } from '@tiptap/pm/state';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Editor } from '@tiptap/core';
import type { Node as TiptapNode } from '@tiptap/pm/model';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isNodeInSchema(
	nodeName: string,
	editor: Editor | null
): boolean {
	if (!editor?.schema) return false;

	return editor.schema.spec.nodes.get(nodeName) !== undefined;
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

function findNodeAtPosition(editor: Editor, position: number) {
	try {
		const node = editor.state.doc.nodeAt(position);

		if (!node) {
			return null;
		}

		return node;
	} catch {
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
