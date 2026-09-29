import { describe, expect, it } from 'vitest'
import { locales } from '../../../src/messages'
import { beforeContent } from '../render'
import {
  click,
  doc,
  type MenuOptions,
  paragraph,
  pause,
  placeCursor,
  renderMenu,
  type,
} from './helpers'

const { en, 'zh-CN': zhCN } = locales

/** The paragraphs of the editable surface and the text that each displays before its content. */
function displayedBefore(surface: HTMLElement): Array<string | null> {
  return Array.from(surface.querySelectorAll('p')).map((element) => beforeContent(element))
}

async function openNewParagraph(options: MenuOptions = {}) {
  const result = await renderMenu({ initialContent: doc(paragraph('Title')), ...options })
  await placeCursor(result.editor, 'end')
  await type('{Enter}')
  return result
}

describe('empty-line hint', () => {
  it('shows the hint in the new empty paragraph that holds the cursor only', async () => {
    const { editor, surface } = await openNewParagraph()
    expect(displayedBefore(surface)).toEqual([null, en.slashMenuHint])
    expect(JSON.stringify(editor.getJSON())).not.toContain(en.slashMenuHint)
    expect(editor.getText()).not.toContain(en.slashMenuHint)

    await pause()
    await type('{ArrowUp}')
    await expect.poll(() => editor.state.selection.from).toBeLessThan(8)
    expect(displayedBefore(surface)).toEqual([null, null])
  })

  it('hides the hint while the editable surface does not have the focus', async () => {
    const { surface } = await openNewParagraph()
    expect(displayedBefore(surface)).toEqual([null, en.slashMenuHint])

    const outside = document.createElement('button')
    outside.textContent = 'Outside'
    document.body.append(outside)
    try {
      await click(outside)
      expect(document.activeElement).toBe(outside)
      expect(displayedBefore(surface)).toEqual([null, null])
    } finally {
      outside.remove()
    }
  })

  it('shows the zh-CN hint', async () => {
    const { surface } = await openNewParagraph({ locale: 'zh-CN' })
    expect(displayedBefore(surface)).toEqual([null, zhCN.slashMenuHint])
  })

  it('shows the hint of the new locale when the locale changes', async () => {
    const { surface, update } = await openNewParagraph({ locale: 'en' })
    expect(displayedBefore(surface)).toEqual([null, en.slashMenuHint])
    await update({ initialContent: doc(paragraph('Title')), locale: 'zh-CN' })
    expect(displayedBefore(surface)).toEqual([null, zhCN.slashMenuHint])
    await update({
      initialContent: doc(paragraph('Title')),
      locale: 'zh-CN',
      messages: { slashMenuHint: 'Press /' },
    })
    expect(displayedBefore(surface)).toEqual([null, 'Press /'])
  })

  it('shows the placeholder of NotraKit instead in an empty document', async () => {
    const { editor, surface } = await renderMenu()
    await placeCursor(editor, 'end')
    expect(editor.view.hasFocus()).toBe(true)
    expect(displayedBefore(surface)).toEqual([en.placeholder])
  })

  it('shows the hint instead of the placeholder in a document of several empty paragraphs', async () => {
    const { editor, surface } = await renderMenu({ initialContent: doc(paragraph(), paragraph()) })
    await placeCursor(editor, 1)
    expect(displayedBefore(surface)).toEqual([en.slashMenuHint, null])
  })

  it('shows no hint without SlashMenu.Root', async () => {
    const { surface } = await openNewParagraph({ slashMenu: false })
    expect(displayedBefore(surface)).toEqual([null, null])

    const empty = await renderMenu({ slashMenu: false })
    await placeCursor(empty.editor, 'end')
    expect(displayedBefore(empty.surface)).toEqual([en.placeholder])
  })

  it('shows no hint while the editor is not editable', async () => {
    const { editor, surface } = await openNewParagraph()
    expect(displayedBefore(surface)).toEqual([null, en.slashMenuHint])
    await placeCursor(editor, 'end')
    editor.setEditable(false)
    expect(displayedBefore(surface)).toEqual([null, null])
  })
})
