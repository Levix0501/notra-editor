import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Notra Editor Next.js fixture',
  // An empty icon keeps the browser from requesting a missing favicon.
  icons: { icon: 'data:,' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
