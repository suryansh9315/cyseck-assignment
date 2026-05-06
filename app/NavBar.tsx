'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type User = { userId: string; role: 'admin' | 'employee'; name: string }

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setLoggingOut(false)
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
  }, [pathname])

  if (pathname === '/login' || !user) return null

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav
      className="px-6 flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <span
        className="text-sm font-semibold tracking-tight"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.01em' }}
      >
        CySeck
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {user.name}
        </span>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: user.role === 'admin' ? '#1D1D1F' : '#F5F5F7',
            color: user.role === 'admin' ? '#FFFFFF' : '#6E6E73',
            border: user.role === 'admin' ? 'none' : '1px solid var(--border)',
          }}
        >
          {user.role === 'admin' ? 'Admin' : 'Employee'}
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}
