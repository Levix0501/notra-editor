import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { describe, expect, it } from 'vitest'
import { NotraKit } from '../../src'
import { renderEditor } from './render'

function contentElement(container: HTMLElement): HTMLElement {
  const surface = container.querySelector('[contenteditable="true"]')
  const element = surface?.parentElement
  if (!element) throw new Error('no content element')
  return element
}

describe('NotraEditor.Content className', () => {
  it('carries the default classes when no className is passed', async () => {
    const { container } = await renderEditor({ extensions: [NotraKit] })
    const element = contentElement(container)
    expect(element.classList.length).toBeGreaterThan(0)
    expect(element.classList).toContain('text-foreground')
  })

  it('combines className with the default classes like cn()', async () => {
    const plain = await renderEditor({ extensions: [NotraKit] })
    const defaultClasses = contentElement(plain.container).className
    await plain.unmount()

    const { container } = await renderEditor({ extensions: [NotraKit] }, 'p-10 custom-x')
    const merged = contentElement(container).className
    expect(merged).toBe(twMerge(clsx(defaultClasses, 'p-10 custom-x')))
    expect(merged.split(' ')).toEqual(expect.arrayContaining(['p-10', 'custom-x']))
  })

  it('drops the default classes that a host class overrides', async () => {
    const plain = await renderEditor({ extensions: [NotraKit] })
    const defaultClasses = contentElement(plain.container).className
    await plain.unmount()

    const { container } = await renderEditor({ extensions: [NotraKit] }, 'text-lg text-primary')
    const classes = contentElement(container).className.split(' ')
    expect(defaultClasses.split(' ')).toContain('text-base')
    expect(classes).not.toContain('text-base')
    expect(classes).not.toContain('text-foreground')
    expect(classes).toEqual(expect.arrayContaining(['text-lg', 'text-primary']))
  })
})
