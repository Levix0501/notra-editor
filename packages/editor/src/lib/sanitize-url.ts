const DEFAULT_PROTOCOLS = ["http", "https", "mailto", "tel"];

export function isAllowedUri(uri: string, protocols: string[] = DEFAULT_PROTOCOLS): boolean {
  try {
    const scheme = new URL(uri).protocol.replace(/:$/, "").toLowerCase();
    return protocols.includes(scheme);
  } catch {
    return false;
  }
}

export function sanitizeUrl(
  input: string,
  base: string,
  protocols: string[] = DEFAULT_PROTOCOLS,
): string {
  try {
    const url = new URL(input, base);
    if (isAllowedUri(url.href, protocols)) return url.href;
  } catch {
    // invalid URL falls through to "#"
  }
  return "#";
}
