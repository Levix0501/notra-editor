/** A color value that a rule of one of the content element's classes declares. */
export interface ColorCandidate {
  /** The class of the content element whose rule declares the value. */
  className: string
  /** The shadcn semantic token that the value names, or `null` for `transparent` and the like. */
  token: string | null
  /** The opacity modifier of the class, in percent, if it has one. */
  opacity: number | null
  /** The computed value that the declared value currently produces. */
  expected: string
}

/** A color property of one element that the content element's classes set. */
export interface ColorCheck {
  /** A short description of the element, including its pseudo-element. */
  element: string
  /** The CSS longhand property. */
  property: string
  /** The computed value on the element. */
  actual: string
  /** The values that matching rules declare; the cascade picks one of them. */
  candidates: ColorCandidate[]
  /** The candidate whose value the element shows, if any. */
  applied: ColorCandidate | null
}

/** A rule of one of the content element's classes that sets a token color. */
export interface ColorRule {
  className: string
  selector: string
  property: string
  token: string
  /** How many elements (or pseudo-elements) the rule currently applies to. */
  matches: number
}

export interface ColorAudit {
  checks: ColorCheck[]
  rules: ColorRule[]
}

/** Options of `auditContentColors`. */
export interface ColorAuditOptions {
  /** The shadcn semantic tokens. */
  tokens: string[]
  /**
   * Audits the classes of every element of the subtree, not only those of its root, and takes
   * each token's value from the element that the rule applies to, so that tokens that an
   * ancestor such as a `dark` container redefines are taken into account.
   */
  subtree?: boolean
}

/**
 * Runs in the page. Finds the CSS rules that `content`'s classes contribute and that set a color
 * property to a shadcn semantic token (or to `transparent`, `currentcolor` or `inherit`). For
 * every element such a rule applies to, it records the computed value of the property and the
 * values that the matching rules declare, computed from the tokens' current values. With the
 * `subtree` option, the classes of every element in `content`'s subtree count, and each token's
 * value is taken from the element that the rule applies to.
 *
 * The function is self-contained so that Playwright can serialize it into the page.
 */
export function auditContentColors(
  content: Element,
  options: string[] | ColorAuditOptions,
): ColorAudit {
  const tokens = Array.isArray(options) ? options : options.tokens
  const subtree = !Array.isArray(options) && options.subtree === true
  const longhands: Record<string, string[]> = {
    color: ['color'],
    'background-color': ['background-color'],
    'border-color': [
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
    ],
    'border-top-color': ['border-top-color'],
    'border-right-color': ['border-right-color'],
    'border-bottom-color': ['border-bottom-color'],
    'border-left-color': ['border-left-color'],
    'border-inline-color': ['border-inline-start-color', 'border-inline-end-color'],
    'border-block-color': ['border-block-start-color', 'border-block-end-color'],
    'outline-color': ['outline-color'],
    'text-decoration-color': ['text-decoration-color'],
    'caret-color': ['caret-color'],
    'accent-color': ['accent-color'],
    'column-rule-color': ['column-rule-color'],
    fill: ['fill'],
    stroke: ['stroke'],
  }

  function splitTopLevel(text: string, separator: string): string[] {
    const parts: string[] = []
    let depth = 0
    let current = ''
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index] as string
      if (char === '\\') {
        current += char + (text[index + 1] ?? '')
        index += 1
        continue
      }
      if (char === '(' || char === '[') depth += 1
      if (char === ')' || char === ']') depth -= 1
      if (char === separator && depth === 0) {
        parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    if (current.trim()) parts.push(current.trim())
    return parts
  }

  function nest(parent: string | null, child: string): string {
    if (!parent) return child
    return splitTopLevel(child, ',')
      .map((part) =>
        part.includes('&') ? part.replaceAll('&', `:is(${parent})`) : `:is(${parent}) ${part}`,
      )
      .join(', ')
  }

  const collected: Array<{ selector: string; cssText: string }> = []

  function visit(rules: CSSRuleList, parent: string | null): void {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const selector = nest(parent, rule.selectorText)
        collected.push({ selector, cssText: rule.style.cssText })
        if (rule.cssRules.length) visit(rule.cssRules, selector)
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.media.mediaText).matches) visit(rule.cssRules, parent)
      } else if (rule instanceof CSSSupportsRule) {
        if (CSS.supports(rule.conditionText)) visit(rule.cssRules, parent)
      } else if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
        visit(rule.cssRules, parent)
      } else if (parent && 'style' in rule && rule.style instanceof CSSStyleDeclaration) {
        // Declarations nested directly in a grouping rule inside a style rule.
        collected.push({ selector: parent, cssText: rule.style.cssText })
      }
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules, null)
    } catch {
      // Stylesheets from other origins cannot be read and do not belong to the host.
    }
  }

  function classPattern(className: string): RegExp {
    const escaped = CSS.escape(className).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\.${escaped}(?![\\w-]|\\\\)`)
  }

  const ownerClasses = subtree
    ? [
        ...new Set(
          [content, ...content.querySelectorAll('*')].flatMap((node) => [...node.classList]),
        ),
      ]
    : Array.from(content.classList)
  const classPatterns = ownerClasses.map((className) => ({
    className,
    pattern: classPattern(className),
  }))

  const tokenPattern = new RegExp(`var\\(--(?:color-)?(${tokens.join('|')})\\)`)
  const opacityPattern = /color-mix\(in \w+, var\([^)]*\) (\d+(?:\.\d+)?)%, transparent\)/
  const keywordPattern = /^(transparent|currentcolor|inherit)$/i

  const probe = document.createElement('span')
  probe.style.display = 'none'
  document.body.append(probe)
  const rootStyle = getComputedStyle(document.documentElement)

  function computedColor(value: string): string {
    probe.style.color = ''
    probe.style.color = value
    return getComputedStyle(probe).color
  }

  function tokenColor(token: string, opacity: number | null, element: Element): string {
    const style = subtree ? getComputedStyle(element) : rootStyle
    const value = style.getPropertyValue(`--${token}`).trim()
    return computedColor(
      opacity === null ? value : `color-mix(in oklab, ${value} ${opacity}%, transparent)`,
    )
  }

  function keywordColor(
    keyword: string,
    element: Element,
    pseudo: string | null,
    longhand: string,
  ) {
    if (/^currentcolor$/i.test(keyword)) return getComputedStyle(element, pseudo).color
    if (/^inherit$/i.test(keyword)) {
      const parent = pseudo ? element : element.parentElement
      return parent ? getComputedStyle(parent).getPropertyValue(longhand) : ''
    }
    return computedColor(keyword)
  }

  const numbers = new Map<Element, number>()

  function describe(element: Element): string {
    const classes = Array.from(element.classList)
    if (element === content) return 'content'
    const description = `${element.tagName.toLowerCase()}${classes.length ? `.${classes.join('.')}` : ''}`
    if (!subtree) return description
    // Elements with the same classes, such as the options of a list, are told apart.
    if (!numbers.has(element)) numbers.set(element, numbers.size + 1)
    return `${description}#${numbers.get(element)}`
  }

  const checks = new Map<string, ColorCheck>()
  const rules: ColorRule[] = []

  for (const { selector, cssText } of collected) {
    const owner = classPatterns.find(({ pattern }) => pattern.test(selector))
    if (!owner) continue

    for (const declaration of splitTopLevel(cssText, ';')) {
      const colon = declaration.indexOf(':')
      if (colon < 0) continue
      const property = declaration.slice(0, colon).trim()
      const value = declaration
        .slice(colon + 1)
        .replace(/\s*!important\s*$/, '')
        .trim()
      const properties = longhands[property]
      if (!properties) continue
      const tokenMatch = tokenPattern.exec(value)
      const keyword = keywordPattern.test(value) ? value : null
      if (!tokenMatch && !keyword) continue

      const token = tokenMatch ? (tokenMatch[1] as string) : null
      const opacityMatch = opacityPattern.exec(value)
      const opacity = opacityMatch ? Number(opacityMatch[1]) : null
      let matches = 0

      for (const complex of splitTopLevel(selector, ',')) {
        const pseudoMatch = /::?(before|after|marker|placeholder|selection)$/.exec(complex)
        const pseudo = pseudoMatch ? `::${pseudoMatch[1]}` : null
        if (pseudo === '::placeholder' || pseudo === '::selection') continue
        const base = pseudoMatch ? complex.slice(0, pseudoMatch.index) : complex
        let elements: Element[]
        try {
          elements = Array.from(document.querySelectorAll(base))
        } catch {
          continue
        }
        for (const element of elements) {
          if (element !== content && !content.contains(element)) continue
          matches += 1
          const style = getComputedStyle(element, pseudo)
          for (const longhand of properties) {
            const key = `${describe(element)}${pseudo ?? ''} ${longhand}`
            let check = checks.get(key)
            if (!check) {
              check = {
                element: `${describe(element)}${pseudo ?? ''}`,
                property: longhand,
                actual: style.getPropertyValue(longhand),
                candidates: [],
                applied: null,
              }
              checks.set(key, check)
            }
            const expected = token
              ? tokenColor(token, opacity, element)
              : keywordColor(keyword as string, element, pseudo, longhand)
            const candidate: ColorCandidate = {
              className: owner.className,
              token,
              opacity,
              expected,
            }
            check.candidates.push(candidate)
            if (!check.applied && candidate.expected === check.actual) check.applied = candidate
          }
        }
      }
      if (token) rules.push({ className: owner.className, selector, property, token, matches })
    }
  }

  probe.remove()
  return { checks: [...checks.values()], rules }
}

/**
 * Runs in the page. Returns the classes of `content`, or with `subtree` of every element in its
 * subtree, for which no stylesheet of the page has a rule, which would mean the host's Tailwind
 * CSS build did not generate them.
 */
export function classesWithoutRules(content: Element, subtree?: boolean): string[] {
  const selectors: string[] = []
  function visit(rules: CSSRuleList): void {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) selectors.push(rule.selectorText)
      if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) visit(rule.cssRules)
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules)
    } catch {
      // Stylesheets from other origins cannot be read.
    }
  }
  const classes = subtree
    ? [
        ...new Set(
          [content, ...content.querySelectorAll('*')].flatMap((node) => [...node.classList]),
        ),
      ]
    : Array.from(content.classList)
  return classes.filter((className) => {
    const escaped = CSS.escape(className).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\.${escaped}(?![\\w-]|\\\\)`)
    return !selectors.some((selector) => pattern.test(selector))
  })
}

/**
 * Runs in the page. Paints each CSS color, which may use `var()`, over a gray canvas and returns
 * the resulting sRGB bytes, so that colors written in different color spaces can be compared.
 */
export function colorBytes(values: string[]): number[][] {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('No 2D canvas context')
  const probe = document.createElement('span')
  probe.style.display = 'none'
  document.body.append(probe)
  const bytes = values.map((value) => {
    probe.style.color = ''
    probe.style.color = value
    context.fillStyle = '#808080'
    context.fillRect(0, 0, 1, 1)
    context.fillStyle = getComputedStyle(probe).color
    context.fillRect(0, 0, 1, 1)
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  })
  probe.remove()
  return bytes
}

/** Whether two results of `colorBytes` show the same color, allowing for rounding. */
export function sameColorBytes(a: number[] | undefined, b: number[] | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false
  return a.every((value, index) => Math.abs(value - (b[index] ?? Number.NaN)) <= 3)
}
