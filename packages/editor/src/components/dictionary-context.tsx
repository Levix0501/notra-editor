import { createContext, use } from "react"

import { createDictionary, type NotraDictionary } from "#i18n/dictionary.ts"

export const NotraDictionaryContext = createContext<NotraDictionary>(createDictionary())

/** Returns the dictionary of the closest notra editor. */
export function useDictionary(): NotraDictionary {
  return use(NotraDictionaryContext)
}
