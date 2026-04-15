import { NotraEditor, defaultPlugins } from 'notra-editor';
import { useState } from 'react';

import 'notra-editor/ui.css';
import 'notra-editor/themes/obsidian-editor.css';

function App() {
	const [markdown, setMarkdown] = useState(`# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

This is a paragraph with **bold text**, *italic text*, ~~strikethrough~~, and ***bold italic*** combined. Here is some \`inline code\` within a sentence.

This is a [link to Obsidian](https://obsidian.md) and here is another paragraph to show spacing between blocks.

> This is a blockquote. It can contain **bold**, *italic*, and other formatting.
>
> It can also span multiple paragraphs.

---

- Unordered list item 1
- Unordered list item 2
  - Nested item A
  - Nested item B
    - Deeply nested item
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
   1. Nested ordered item
   2. Another nested item
      1. Deeply nested ordered
3. Ordered list item 3

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Fetch user data from API
async function getUser(id: number): Promise<User> {
  const response = await fetch(\\\`/api/users/\\\${id}\\\`);
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

const user = await getUser(42);
console.log(user.name);
\`\`\`

\`\`\`css
.container {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}
\`\`\`

Here is a paragraph after the code blocks. The ==highlighted text== should stand out, and here is a sentence with both **bold** and *italic* mixed together.
`);

	return (
		<div className="h-screen">
			<NotraEditor
				content={markdown}
				plugins={defaultPlugins}
				toolbar="both"
				onChange={setMarkdown}
			/>
		</div>
	);
}

export default App;
