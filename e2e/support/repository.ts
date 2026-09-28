import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The root of the repository. */
export const repositoryRoot: string = fileURLToPath(new URL('../..', import.meta.url))

/** The shadcn/ui semantic color tokens. */
export const shadcnTokens: string[] = [
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

/** Reads a file of the repository. */
export function readRepositoryFile(path: string): string {
  return readFileSync(join(repositoryRoot, path), 'utf8')
}

/** The directory of the package's distributed files, found through its `exports`. */
export function packageDistDirectory(): string {
  const entry = createRequire(import.meta.url).resolve('@notra/editor')
  return dirname(entry)
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

/** Every whitespace-separated word inside a string literal of the package's distributed JS. */
export function distributedClassCandidates(): Set<string> {
  const words = new Set<string>()
  for (const file of listFiles(packageDistDirectory()).filter((path) => path.endsWith('.js'))) {
    const code = readFileSync(file, 'utf8')
    for (const match of code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
      for (const word of (match[1] ?? match[2] ?? '').split(/\s+/)) if (word) words.add(word)
    }
  }
  return words
}

/** Parses the custom properties declared by the rules with the given selector. */
export function customProperties(css: string, selector: string): Map<string, string> {
  const result = new Map<string, string>()
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const block of css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))) {
    for (const declaration of (block[1] ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      result.set(declaration[1] as string, (declaration[2] as string).trim())
    }
  }
  return result
}
