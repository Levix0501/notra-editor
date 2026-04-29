import { NotraEditor } from 'notra-editor';
import 'notra-editor/themes/default/shared.css';
import 'notra-editor/themes/default/editor.css';
import { useState } from 'react';

import { ModeToggle } from './components/mode-toggle';

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

### Code Blocks

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const users = ['Alice', 'Bob'].map(greet);
\`\`\`

\`\`\`python
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

\`\`\`bash
echo "deploy" && ./scripts/release.sh --tag v1
\`\`\`

### Image

![A red circle](https://placehold.co/300x200/e63946/ffffff?text=Hello "Test image")

> This is a blockquote. It can contain **formatted text** and other elements.

---

That's a horizontal rule above. Happy editing!
`;

export function App() {
	const [content, setContent] = useState(INITIAL_CONTENT);

	return (
		<>
			<NotraEditor value={content} onChange={setContent} />
			<div className="fixed right-4 bottom-4 z-50">
				<ModeToggle />
			</div>
		</>
	);
}
