import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "browser",
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  // Every export is a client component (React Server Components).
  banner: { js: '"use client";' },
})
