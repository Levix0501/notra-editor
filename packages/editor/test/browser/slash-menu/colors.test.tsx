import { describe, expect, it } from 'vitest'
import { auditContentColors } from '../../../../../e2e/support/color-audit'
import themeCss from '../../../src/theme.css?raw'
import { expectOpen, menuElement, placeCursor, renderMenu, type } from './helpers'

const tokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
]

/** The custom properties that theme.css declares for `selector`. */
function themeValues(selector: string): Map<string, string> {
  const values = new Map<string, string>()
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const block of themeCss.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))) {
    for (const declaration of (block[1] ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      values.set(declaration[1] as string, (declaration[2] as string).trim())
    }
  }
  return values
}

describe('colors in a dark container', () => {
  it('take the dark values of theme.css while <html> is light', async () => {
    const light = themeValues(':root')
    const dark = themeValues('.dark')
    const container = document.createElement('div')
    container.className = 'dark'
    document.body.append(container)
    const probe = document.createElement('span')
    container.append(probe)
    const computed = (value: string) => {
      probe.style.color = ''
      probe.style.color = value
      return getComputedStyle(probe).color
    }

    try {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      const { editor } = await renderMenu({ content: { container } })
      await placeCursor(editor, 'end')

      for (const query of ['/', 'zzzz']) {
        await type(query)
        await expectOpen(true)
        const menu = menuElement() as HTMLElement
        expect(container.contains(menu)).toBe(true)
        const audit = auditContentColors(menu, { tokens, subtree: true })
        expect(audit.checks.length).toBeGreaterThan(0)
        expect(audit.checks.filter((check) => check.applied === null)).toEqual([])
        for (const check of audit.checks) {
          const token = check.applied?.token
          if (!token) continue
          const opacity = check.applied?.opacity ?? null
          const value = (values: Map<string, string>) => {
            const declared = values.get(`--${token}`) as string
            return opacity === null
              ? declared
              : `color-mix(in oklab, ${declared} ${opacity}%, transparent)`
          }
          expect(check.actual, `${check.element} ${check.property}`).toBe(computed(value(dark)))
          if (light.get(`--${token}`) !== dark.get(`--${token}`)) {
            expect(check.actual).not.toBe(computed(value(light)))
          }
        }
      }
    } finally {
      container.remove()
    }
  })
})
