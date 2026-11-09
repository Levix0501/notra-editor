import { en } from "./en"

/** All user-facing strings rendered by the editor. */
export type NotraDictionary = typeof en

/** A recursive partial of {@link NotraDictionary}, used for overrides. */
export type PartialNotraDictionary = {
  [K in keyof NotraDictionary]?: DeepPartial<NotraDictionary[K]>
}

type DeepPartial<T> = T extends string ? T : { [K in keyof T]?: DeepPartial<T[K]> }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override)) {
    return (override === undefined ? base : override) as T
  }

  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      result[key] = deepMerge(result[key], value)
    }
  }
  return result as T
}

/**
 * Creates a complete dictionary from a partial one. Missing entries fall back
 * to `base` (English by default).
 *
 * @example
 * const dictionary = createDictionary({ placeholder: { default: "Write…" } })
 */
export function createDictionary(overrides?: PartialNotraDictionary, base: NotraDictionary = en): NotraDictionary {
  return overrides ? deepMerge(base, overrides) : base
}
