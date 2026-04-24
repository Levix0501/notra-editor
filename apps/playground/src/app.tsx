import { NotraEditor } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';
import 'notra-editor/styles/globals.css';
import { useState } from 'react';

const INITIAL_CONTENT = `# Welcome to notra-editor

This is a **markdown-first** editor. Try editing this content!

## Features

- **Bold**, *italic*, ~~strikethrough~~, and \`inline code\`
- [Links](https://github.com) are supported too

### Lists

1. First ordered item
2. Second ordered item
   1. Nested item

- Bullet point one
- Bullet point two
  - Nested bullet

### Task List

- [ ] Unchecked task
- [x] Completed task

### Code Block

\`\`\`
function hello() {
  console.log("Hello from notra-editor!");
}
\`\`\`

> This is a blockquote. It can contain **formatted text** and other elements.

---

That's a horizontal rule above. Happy editing!
`;

export function App() {
	const [content, setContent] = useState(INITIAL_CONTENT);

	return (
		<NotraEditor
			className="w-screen h-screen"
			placeholder="Start writing..."
			value={content}
			onChange={setContent}
		/>
	);
}
