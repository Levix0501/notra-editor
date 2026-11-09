const EXPLICIT_URL = /^(?:[a-z][a-z\d+.-]*:|\/|#|\?)/i
const DOMAIN_LIKE = /^[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:[/?#].*)?$/i

/**
 * Normalizes user input into a link target: `example.com` becomes
 * `https://example.com`, explicit URLs and relative paths are kept as-is.
 * Returns `null` for empty input. Unsafe protocols are rejected later by the
 * Link extension's URL validation.
 */
export function normalizeUrl(input: string): string | null {
  const value = input.trim()
  if (!value) {
    return null
  }
  if (EXPLICIT_URL.test(value)) {
    return value
  }
  if (DOMAIN_LIKE.test(value)) {
    return `https://${value}`
  }
  return value
}
