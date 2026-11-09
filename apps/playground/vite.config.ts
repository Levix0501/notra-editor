import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defaultClientConditions, defineConfig } from "vite"

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    // In development the editor is consumed straight from its TypeScript
    // sources (with HMR) through the `@notra/source` export condition.
    // Production builds use the published `dist` output, like a real consumer.
    conditions: command === "serve" ? ["@notra/source", ...defaultClientConditions] : [...defaultClientConditions],
    dedupe: ["react", "react-dom"],
  },
}))
