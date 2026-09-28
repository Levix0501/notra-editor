import {
  type AnyExtension,
  type Editor,
  type Extensions,
  flattenExtensions,
  getExtensionField,
  Mark,
} from '@tiptap/core'
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NotraKit } from '../../src'
import { focusEnd, renderEditor } from './render'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customMark: {
      setCustomMark: () => ReturnType
    }
  }
}

const CustomMark = Mark.create({
  name: 'customMark',
  parseHTML: () => [{ tag: 'mark' }],
  renderHTML: ({ HTMLAttributes }) => ['mark', HTMLAttributes, 0],
  addCommands() {
    return {
      setCustomMark:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
    }
  },
})

const baseNodeNames = ['doc', 'paragraph', 'text']

function extensionNames(editor: Editor): string[] {
  return editor.extensionManager.extensions.map((extension) => extension.name)
}

async function coreExtensionNames(): Promise<string[]> {
  const { editor, unmount } = await renderEditor({ extensions: [] })
  const names = extensionNames(editor).filter((name) => !baseNodeNames.includes(name))
  await unmount()
  return names
}

describe('extensions', () => {
  it('edits unformatted paragraphs without NotraKit', async () => {
    const { editor } = await renderEditor({ extensions: [] })

    expect(Object.keys(editor.schema.nodes).sort()).toEqual([...baseNodeNames].sort())
    expect(Object.keys(editor.schema.marks)).toEqual([])

    await focusEnd(editor)
    await userEvent.keyboard('# ')
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '# ' }] }],
    })
  })

  it('installs exactly the extensions that NotraKit contributes', async () => {
    const core = await coreExtensionNames()
    const { editor } = await renderEditor({ extensions: [NotraKit] })

    const installed = extensionNames(editor).filter((name) => !core.includes(name))
    const contributed = flattenExtensions([NotraKit]).map((extension) => extension.name)

    expect(installed.sort()).toEqual(contributed.sort())
    expect(new Set(installed).size).toBe(installed.length)
  })

  it('adds only the base nodes that the extensions lack', async () => {
    const core = await coreExtensionNames()
    const kit = NotraKit.configure({ paragraph: false })
    const { editor } = await renderEditor({ extensions: [kit] })

    const installed = extensionNames(editor).filter((name) => !core.includes(name))
    const contributed = flattenExtensions([kit]).map((extension) => extension.name)

    expect(contributed).not.toContain('paragraph')
    expect(installed.sort()).toEqual([...contributed, 'paragraph'].sort())
  })

  it('accepts an entry for each contained extension, keyed by its name', () => {
    const directNames = (kit: AnyExtension) =>
      (
        getExtensionField<() => Extensions>(kit, 'addExtensions', {
          name: kit.name,
          options: kit.options,
          storage: kit.storage,
        })?.() ?? []
      ).map((extension) => extension.name)

    const contained = directNames(NotraKit)
    expect(contained.length).toBeGreaterThan(0)
    expect(new Set(contained).size).toBe(contained.length)
    for (const name of contained) {
      const remaining = directNames(NotraKit.configure({ [name]: false }))
      expect(remaining.sort(), name).toEqual(contained.filter((other) => other !== name).sort())
    }
  })

  it('removes an extension configured as false', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit.configure({ codeBlock: false })],
    })
    expect(editor.schema.nodes.codeBlock).toBeUndefined()

    await focusEnd(editor)
    await userEvent.keyboard('``` code')
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '``` code' }] }],
    })
  })

  it('adjusts an extension configured with options', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit.configure({ heading: { levels: [1, 2] } })],
    })

    await focusEnd(editor)
    await userEvent.keyboard('### Third')
    expect(editor.getJSON().content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: '### Third' }] },
    ])

    await act(async () => {
      editor.commands.clearContent()
    })
    await focusEnd(editor)
    await userEvent.keyboard('## Second')
    expect(editor.getJSON().content).toEqual([
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Second' }] },
    ])
  })

  it('installs extensions passed alongside NotraKit', async () => {
    const { editor } = await renderEditor({
      extensions: [NotraKit, CustomMark],
      initialContent: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'marked' }] }],
      },
    })
    expect(editor.schema.marks.customMark).toBeDefined()

    await act(async () => {
      editor.chain().setTextSelection({ from: 1, to: 7 }).setCustomMark().run()
    })
    expect(editor.getJSON().content).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', marks: [{ type: 'customMark' }], text: 'marked' }],
      },
    ])
  })
})
