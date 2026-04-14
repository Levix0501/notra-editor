import { MarkdownSerializer } from 'prosemirror-markdown';
import type { CollectedMarkdownRules } from '../core/create-editor';

export function buildMarkdownSerializer(
	rules: CollectedMarkdownRules
): MarkdownSerializer {
	return new MarkdownSerializer(rules.serializerNodes, rules.serializerMarks);
}
