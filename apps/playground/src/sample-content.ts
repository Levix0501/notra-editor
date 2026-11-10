export const sampleContent = `
<h1>Welcome to notra-editor</h1>
<p>A <strong>block-based</strong> rich text editor for React, built with <a href="https://tiptap.dev">Tiptap</a>, <a href="https://ui.shadcn.com">shadcn/ui</a> and <a href="https://tailwindcss.com">Tailwind CSS</a>. Type <code>/</code> to insert a block, select text to format it, or hover a block and use the handle on its left to move it.</p>
<h2>Blocks</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Slash commands and Markdown shortcuts</p></li>
  <li data-type="taskItem" data-checked="true"><p>Drag and drop blocks</p></li>
  <li data-type="taskItem" data-checked="false"><p>Build something great</p></li>
</ul>
<ul>
  <li><p>Bulleted lists</p><ul><li><p>can be nested</p></li></ul></li>
  <li><p>Shortcuts such as <code>#</code>, <code>-</code>, <code>1.</code>, <code>[]</code> and <code>&gt;</code> work while typing</p></li>
</ul>
<ol>
  <li><p>Numbered lists</p></li>
  <li><p>Tables, images and code blocks</p></li>
</ol>
<blockquote><p>The best way to predict the future is to invent it. — Alan Kay</p></blockquote>
<details>
  <summary>Toggle lists hide content</summary>
  <div data-type="detailsContent"><p>Click the arrow to collapse or expand the content.</p></div>
</details>
<h2>Formatting</h2>
<p>Text can be <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, <s>struck through</s>, <code>inline code</code>, <span style="color: var(--notra-text-blue, oklch(54.6% 0.245 262.881))">colored</span> or <mark data-color="var(--notra-highlight-yellow, oklch(94.5% 0.129 101.54))" style="background-color: var(--notra-highlight-yellow, oklch(94.5% 0.129 101.54))">highlighted</mark>.</p>
<pre><code class="language-tsx">import { NotraEditor } from "notra-editor"
import "notra-editor/styles.css"

export function App() {
  return &lt;NotraEditor placeholder="Write something…" /&gt;
}</code></pre>
<table>
  <tbody>
    <tr><th><p>Feature</p></th><th><p>Shortcut</p></th></tr>
    <tr><td><p>Insert a block</p></td><td><p><code>/</code></p></td></tr>
    <tr><td><p>Add a link</p></td><td><p><code>Mod + K</code></p></td></tr>
  </tbody>
</table>
<hr>
<p>Happy writing!</p>
`

/**
 * A Markdown file as found in a Git repository. In the "Markdown file" mode,
 * unchanged blocks are written back exactly as they are here.
 */
export const sampleMarkdown = `---
title: Getting started
tags: [docs, markdown]
---

<p align="center">
  <img src="https://placehold.co/96x96/png" alt="Logo" width="96">
</p>

Getting started
===============

Edit this file like a document: only the blocks you change are rewritten,
everything else is saved *exactly* as it was written, __including__ its style.

> [!TIP]
> Open the **Markdown** output and compare it with this source.

#### Shortcuts

* Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to add a link
* Type \`/\` to insert a block
* Read the [Tiptap docs][tiptap]

1) Install the package
1) Render the editor

- [x] Front matter, HTML and alerts are kept
- [ ] Try to break it

| Feature        | Kept |
|:---------------|-----:|
| Front matter   |  yes |
| HTML blocks    |  yes |

<details>
<summary>Toggles are written as HTML</summary>

They work on GitHub too.

</details>

~~~ts
const editor = useNotraEditor({ content, contentType: "markdown" })
~~~

***

[tiptap]: https://tiptap.dev
`
