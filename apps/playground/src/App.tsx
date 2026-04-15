import { NotraEditor, defaultPlugins } from 'notra-editor';
import { useState } from 'react';

import 'notra-editor/themes/obsidian-editor.css';

function App() {
	const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing...');

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
