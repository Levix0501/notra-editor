import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Selection } from '@tiptap/extensions';

import { HorizontalRule } from './horizontal-rule';
import { Starter } from './starter';

export const SharedExtensions = [
	Starter,
	HorizontalRule,
	TaskList,
	TaskItem.configure({ nested: true }),
	Superscript,
	Subscript,
	Highlight,
	Typography,
	TextAlign.configure({ types: ['heading', 'paragraph'] }),
	Selection
];
