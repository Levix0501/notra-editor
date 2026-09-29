import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { describe, expect, it } from 'vitest'
import { SlashMenu, type SlashMenuItem } from '../../../src'
import { locales } from '../../../src/messages'
import { cleanup } from '../render'
import {
  commandItem,
  expectOpen,
  type MenuOptions,
  menuElement,
  options,
  placeCursor,
  renderMenu,
  titleOf,
  type,
} from './helpers'

const { en } = locales

async function open(menu: MenuOptions = {}, query = ''): Promise<void> {
  const { editor } = await renderMenu(menu)
  await placeCursor(editor, 'end')
  await type(`/${query}`)
  await expectOpen(true)
}

function emptyElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="slash-menu-empty"]')
}

describe('SlashMenu.Item', () => {
  it('renders the icon, the title and the hint to the right of the title', async () => {
    await open()
    const option = options().find((element) => titleOf(element) === en.blockHeading1)
    if (!option) throw new Error('no Heading 1')
    expect(option.querySelector('svg')).not.toBeNull()
    expect(option.textContent).toBe(`${en.blockHeading1}#`)
    const title = option.querySelector('[data-slot="slash-menu-item-title"]') as HTMLElement
    const hint = option.querySelector('[data-slot="slash-menu-item-hint"]') as HTMLElement
    expect(hint.textContent).toBe('#')
    expect(hint.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      title.getBoundingClientRect().right,
    )
  })

  it('renders only the title of an item without icon and hint', async () => {
    await open({ items: [commandItem('Plain command')] })
    const [option] = options() as [HTMLElement]
    expect(option.textContent).toBe('Plain command')
    expect(option.querySelector('svg')).toBeNull()
    expect(option.querySelector('[data-slot="slash-menu-item-icon"]')).toBeNull()
    expect(option.querySelector('[data-slot="slash-menu-item-hint"]')).toBeNull()
  })

  it('renders its children instead of the icon, title and hint', async () => {
    await open({
      renderItem: (item) => (
        <SlashMenu.Item item={item}>
          <span>custom</span>
        </SlashMenu.Item>
      ),
    })
    const all = options()
    expect(all).toHaveLength(9)
    for (const option of all) {
      expect(option.innerHTML).toBe('<span>custom</span>')
    }
  })
})

describe('SlashMenu.Empty', () => {
  it('renders the no-results message only while no item is displayed', async () => {
    await open()
    expect(emptyElement()).toBeNull()
    await type('zzzz')
    await expect.poll(() => emptyElement()?.textContent).toBe(en.slashMenuEmpty)
  })

  it('renders its children instead of the no-results message', async () => {
    await open({ emptyChildren: <span>none</span> }, 'zzzz')
    expect(emptyElement()?.innerHTML).toBe('<span>none</span>')
  })
})

describe('SlashMenu.List', () => {
  it('renders what its child function returns for each displayed item, in display order', async () => {
    const rendered: SlashMenuItem[] = []
    const items = [
      commandItem('One', { group: 'Later' }),
      commandItem('Two'),
      commandItem('Three', { group: 'Later' }),
    ]
    await open({
      items,
      renderItem: (item) => {
        rendered.push(item)
        return <SlashMenu.Item item={item} data-testid={`item-${item.id}`} />
      },
    })
    const ids = options().map((option) => option.dataset.testid)
    expect(ids).toEqual(['item-one', 'item-three', 'item-two'])
    expect(rendered.slice(-3)).toEqual([items[0], items[2], items[1]])
  })
})

describe('className', () => {
  const selectors = {
    content: '[data-slot="slash-menu-content"]',
    list: '[data-slot="slash-menu-list"]',
    item: '[data-slot="slash-menu-item"]',
    empty: '[data-slot="slash-menu-empty"]',
  }
  const variants: Array<[keyof typeof selectors, MenuOptions, string]> = [
    ['content', { content: { className: 'p-10 custom-x' } }, ''],
    ['list', { listClassName: 'p-10 custom-x' }, ''],
    [
      'item',
      { renderItem: (item) => <SlashMenu.Item item={item} className="p-10 custom-x" /> },
      '',
    ],
    ['empty', { emptyClassName: 'p-10 custom-x' }, 'zzzz'],
  ]

  it.each(variants)(
    'combines the className of %s with its default classes',
    async (part, menu, query) => {
      await open({}, query)
      const plain = document.querySelector(selectors[part]) as HTMLElement
      const defaultClasses = plain.className
      expect(plain.classList.length).toBeGreaterThan(0)
      await cleanup()

      await open(menu, query)
      const element = document.querySelector(selectors[part]) as HTMLElement
      expect(element.className).toBe(twMerge(clsx(defaultClasses, 'p-10 custom-x')))
      expect(element.classList).toContain('custom-x')
      expect(element.classList).toContain('p-10')
      expect(menuElement()).not.toBeNull()
    },
  )
})
