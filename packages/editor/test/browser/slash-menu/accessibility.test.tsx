import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { locales } from '../../../src/messages'
import {
  accessibleName,
  expectOpen,
  menuElement,
  options,
  placeCursor,
  renderMenu,
  titleOf,
  type,
} from './helpers'

const { en } = locales

function optionTitled(title: string): HTMLElement {
  const option = options().find((element) => titleOf(element) === title)
  if (!option) throw new Error(`no option ${title}`)
  return option
}

describe('accessibility', () => {
  it('connects the editable surface to the listbox and the highlighted option', async () => {
    const { editor, surface } = await renderMenu({ locale: 'en' })
    expect(surface.getAttribute('role')).toBe('textbox')
    expect(surface.hasAttribute('aria-controls')).toBe(false)
    expect(surface.hasAttribute('aria-activedescendant')).toBe(false)

    await placeCursor(editor, 'end')
    await type('/')
    await expectOpen(true)

    const menu = menuElement() as HTMLElement
    const listboxes = [menu, ...menu.querySelectorAll('*')].filter(
      (element) => element.getAttribute('role') === 'listbox',
    )
    expect(listboxes).toHaveLength(1)
    const [listbox] = listboxes as [Element]
    expect(listbox.id).not.toBe('')
    expect(accessibleName(listbox)).toBe(en.slashMenuLabel)
    await expect.element(page.getByRole('listbox', { name: en.slashMenuLabel })).toBeVisible()

    expect(surface.getAttribute('role')).toBe('textbox')
    expect(surface.getAttribute('aria-controls')).toBe(listbox.id)
    expect(surface.getAttribute('aria-activedescendant')).toBe(optionTitled(en.blockText).id)

    await type('{ArrowDown}')
    expect(surface.getAttribute('aria-activedescendant')).toBe(optionTitled(en.blockHeading1).id)

    const all = options()
    expect(all).toHaveLength(9)
    for (const option of all) {
      expect(listbox.contains(option)).toBe(true)
      expect(option.id).not.toBe('')
    }
    const selected = document.querySelectorAll('[aria-selected="true"]')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toBe(optionTitled(en.blockHeading1))

    const groups = Array.from(listbox.querySelectorAll('[role="group"]'))
    expect(groups).toHaveLength(1)
    expect(accessibleName(groups[0] as Element)).toBe(en.blockGroupBasic)
    await expect.element(page.getByRole('group', { name: en.blockGroupBasic })).toBeVisible()
    await expect
      .element(page.getByRole('option', { name: new RegExp(`^${en.blockHeading1}`) }))
      .toHaveAttribute('aria-selected', 'true')

    await type('{Escape}')
    await expectOpen(false)
    expect(surface.getAttribute('role')).toBe('textbox')
    expect(surface.hasAttribute('aria-controls')).toBe(false)
    expect(surface.hasAttribute('aria-activedescendant')).toBe(false)
  })

  it('keeps aria-controls but drops aria-activedescendant while no item is displayed', async () => {
    const { editor, surface } = await renderMenu()
    await placeCursor(editor, 'end')
    await type('/zzzz')
    await expectOpen(true)
    expect(surface.getAttribute('aria-controls')).toBe(
      document.querySelector('[role="listbox"]')?.id,
    )
    expect(surface.hasAttribute('aria-activedescendant')).toBe(false)
  })
})
