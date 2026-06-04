export function detectLocale(el?: Element | null): string {
  if (typeof document === "undefined") return "";
  const source = el?.closest("[lang]") ?? document.documentElement;
  return source?.getAttribute("lang") ?? "";
}

export function observeHtmlLang(callback: (lang: string) => void): () => void {
  if (typeof document === "undefined") return () => {};
  const target = document.documentElement;
  const observer = new MutationObserver(() => {
    callback(target.getAttribute("lang") ?? "");
  });
  observer.observe(target, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}
