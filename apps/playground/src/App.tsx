import '@editor/styles/editor.css';

import { Editor } from '@editor/core/editor';
import { useState } from 'react';

export function App() {
	const [content, setContent] = useState(
		'<p>Hello World! Start editing...</p>'
	);

	return (
		<div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem' }}>
			<h1
				style={{
					fontSize: '1.875rem',
					fontWeight: 700,
					marginBottom: '1.5rem'
				}}
			>
				Notra Editor Playground
			</h1>

			<div
				style={{
					border: '1px solid #e5e7eb',
					borderRadius: '0.5rem',
					padding: '1rem',
					marginBottom: '1.5rem'
				}}
			>
				<Editor content={content} onChange={setContent} />
			</div>

			<details>
				<summary
					style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 500 }}
				>
					View HTML Output
				</summary>
				<pre
					style={{
						background: '#f9fafb',
						padding: '1rem',
						borderRadius: '0.5rem',
						overflow: 'auto',
						fontSize: '0.875rem',
						marginTop: '0.5rem',
						border: '1px solid #e5e7eb'
					}}
				>
					<code>{content}</code>
				</pre>
			</details>
		</div>
	);
}
