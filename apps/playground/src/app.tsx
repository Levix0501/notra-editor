import { NotraEditor, NotraReader } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';
import 'notra-editor/themes/default/reader.css';
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
	const [showReader, setShowReader] = useState(false);

	return (
		<div className="playground">
			<header className="playground-header">
				<h1>notra-editor playground</h1>
				<button onClick={() => setShowReader(!showReader)}>
					{showReader ? 'Show Editor' : 'Show Reader'}
				</button>
			</header>
			<main className="playground-main">
				{showReader ? (
					<NotraReader className="playground-reader" content={content} />
				) : (
					<NotraEditor
						className="playground-editor"
						placeholder="Start writing..."
						value={content}
						onChange={setContent}
					/>
				)}
			</main>
		</div>
	);
}
