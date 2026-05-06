'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

      router.push(data.role === 'admin' ? '/admin' : '/employee')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-10 text-center">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}
          >
            CySeck
          </span>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Performance Reviews
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--muted)' }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#F5F5F7',
                border: '1px solid transparent',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => (e.currentTarget.style.border = '1px solid #1D1D1F')}
              onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--muted)' }}
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#F5F5F7',
                border: '1px solid transparent',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => (e.currentTarget.style.border = '1px solid #1D1D1F')}
              onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#FF3B30' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: '#000000', color: '#FFFFFF' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
