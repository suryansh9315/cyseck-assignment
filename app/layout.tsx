import type { Metadata } from 'next'
import './globals.css'
import NavBar from './NavBar'

export const metadata: Metadata = {
  title: 'Performance Reviews',
  description: 'Employee performance review system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased" style={{ background: 'var(--background)' }}>
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
