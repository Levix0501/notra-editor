import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Underline } from '@tiptap/extension-underline';

import { HorizontalRule } from './horizontal-rule';
import { Starter } from './starter';

export const EditorExtensions = [
	Starter,
	HorizontalRule,
	TaskList,
	TaskItem.configure({ nested: true }),
	Underline,
	Superscript,
	Subscript
];
