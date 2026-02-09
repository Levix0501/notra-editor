import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';

import { HorizontalRule } from './horizontal-rule';
import { Starter } from './starter';

export const EditorExtensions = [
	Starter,
	HorizontalRule,
	TaskList,
	TaskItem.configure({ nested: true })
];
