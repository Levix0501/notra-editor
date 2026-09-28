import { fileURLToPath } from 'node:url'

/** The file that receives the output of the Next.js development server. */
export const nextDevLog: string = fileURLToPath(new URL('../.logs/next-dev.log', import.meta.url))
