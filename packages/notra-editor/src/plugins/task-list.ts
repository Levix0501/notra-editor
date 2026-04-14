import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { ListTodo } from 'lucide-react';
import { createElement } from 'react';

import { definePlugin } from './define-plugin';

export const taskListPlugin = definePlugin({
	name: 'task-list',
	extensions: [TaskList, TaskItem.configure({ nested: true })],
	markdown: {
		serializer: {
			nodes: {
				taskList: (state, node) => {
					state.renderList(node, '  ', () => '');
				},
				taskItem: (state, node) => {
					const checked = node.attrs.checked ? '[x] ' : '[ ] ';

					state.write('- ' + checked);
					state.renderContent(node);
				}
			}
		},
		parser: {
			tokens: {}
		}
	},
	slashCommands: [
		{
			name: 'Task List',
			description: 'Create a task list with checkboxes',
			icon: createElement(ListTodo, { size: 18 }),
			keywords: ['task', 'todo', 'checklist', 'checkbox'],
			group: 'list',
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleTaskList().run();
			}
		}
	],
	toolbarItems: [
		{
			name: 'task-list',
			icon: createElement(ListTodo, { size: 18 }),
			type: 'button',
			priority: 22,
			group: 'blocks',
			isActive: (editor) => editor.isActive('taskList'),
			command: (editor) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(editor as any).chain().focus().toggleTaskList().run();
			}
		}
	]
});
