import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';

import { CodeBlock } from './code-block';
import { HorizontalRule } from './horizontal-rule';
import { Starter } from './starter';

export const EditorExtensions = [
	Starter,
	HorizontalRule,
	TaskList,
	TaskItem.configure({ nested: true }),
	Superscript,
	Subscript,
	CodeBlock
];
