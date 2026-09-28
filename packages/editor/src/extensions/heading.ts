import { Heading, type HeadingOptions, type Level } from '@tiptap/extension-heading'

const allLevels: Level[] = [1, 2, 3, 4, 5, 6]

/** Returns the configured level closest to `level`, preferring the smaller heading on a tie. */
function closestLevel(level: Level, levels: Level[]): Level {
  let closest = levels[0] ?? level
  for (const candidate of levels) {
    const distance = Math.abs(candidate - level)
    const best = Math.abs(closest - level)
    if (distance < best || (distance === best && candidate > closest)) closest = candidate
  }
  return closest
}

/**
 * Heading that also parses `h1`–`h6` elements whose level is not configured, turning each into
 * the closest configured level. With levels 1–3, pasted `h4`–`h6` become level-3 headings.
 */
export const NotraHeading: typeof Heading = Heading.extend<HeadingOptions>({
  parseHTML() {
    const levels = this.options.levels
    return allLevels.map((level) => ({
      tag: `h${level}`,
      attrs: { level: levels.includes(level) ? level : closestLevel(level, levels) },
    }))
  },
})
