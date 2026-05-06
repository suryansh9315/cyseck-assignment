'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

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
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ background: '#F5F5F7', border: '1px solid transparent', color: 'var(--foreground)' }}
              onFocus={(e) => (e.currentTarget.style.border = '1px solid #1D1D1F')}
              onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                style={{ background: '#F5F5F7', border: '1px solid transparent', color: 'var(--foreground)' }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid #1D1D1F')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#FF3B30' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !EMAIL_RE.test(email) || !password}
            className="w-full rounded-xl py-3 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#000000', color: '#FFFFFF' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
