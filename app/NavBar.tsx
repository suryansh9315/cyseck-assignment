'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type User = { userId: string; role: 'admin' | 'employee' }

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
  }, [pathname])

  // Don't render nav on login page
  if (pathname === '/login' || !user) return null

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-gray-800">Performance Reviews</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded">
                Admin
              </span>
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
              Employee
            </span>
          )}
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}
