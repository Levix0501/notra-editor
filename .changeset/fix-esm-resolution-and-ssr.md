---
'notra-editor': patch
---

- Fix `Module not found` error when importing the package from Next.js App
  Router or other strict-ESM consumers. Relative imports in the published `dist`
  now carry explicit `.mjs`/`.cjs` extensions.
- Fix Tiptap SSR hydration error so `NotraEditor` renders cleanly in Next.js
  without consumers needing extra setup.
