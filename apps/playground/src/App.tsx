import { useState } from 'react';
import { Editor } from '@editor/core/editor';

export default function App() {
  const [content, setContent] = useState('<p>Hello World! Start editing...</p>');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Notra Editor Playground</h1>
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem',
          minHeight: '300px',
        }}
      >
        <Editor content={content} onChange={setContent} />
      </div>
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', color: '#666' }}>View HTML Output</summary>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.875rem',
          }}
        >
          {content}
        </pre>
      </details>
    </div>
  );
}
