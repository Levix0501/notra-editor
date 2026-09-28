import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names the way shadcn/ui does: later Tailwind CSS classes win over earlier
 * classes that set the same property, and every other class is kept.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
