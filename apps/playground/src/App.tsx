import { Editor } from '@editor/core/editor';
import { useState } from 'react';

export function App() {
	const [content, setContent] = useState(
		'<p>Hello World! Start editing...</p>'
	);

	return (
		<div className="max-w-4xl mx-auto p-8">
			<h1 className="text-3xl font-bold mb-6 text-red-900">
				Notra Editor Playground
			</h1>

			<div className="border border-gray-200 rounded-lg p-4 mb-6 bg-white shadow-sm hover:shadow-md transition-shadow">
				<Editor content={content} onChange={setContent} />
			</div>

			<details className="mt-6">
				<summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
					View HTML Output
				</summary>
				<pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm mt-2 border border-gray-200">
					<code className="text-gray-800">{content}</code>
				</pre>
			</details>
		</div>
	);
}
