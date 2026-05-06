'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Assignment = {
  id: string
  review: {
    id: string
    period: string
    employee: { id: string; name: string }
  }
}

// ─── Star Rating Input ────────────────────────────────────────────────────────

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none focus:outline-none transition-colors"
          style={{ color: (hovered || value) >= star ? '#FF9500' : '#E8E8ED' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ─── Assignment Card ──────────────────────────────────────────────────────────

function AssignmentCard({
  assignment,
  onSubmitted,
}: {
  assignment: Assignment
  onSubmitted: (id: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a rating.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignment.id, rating, comments }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onSubmitted(assignment.id)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: '#fff', border: '1px solid var(--border)' }}
    >
      <div>
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}
        >
          {assignment.review.employee.name}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {assignment.review.period}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium mb-2.5" style={{ color: 'var(--muted)' }}>
            Rating
          </label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
            Comments
          </label>
          <textarea
            required
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your feedback…"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors"
            style={{
              background: '#F5F5F7',
              border: '1px solid transparent',
              color: 'var(--foreground)',
            }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid #1D1D1F')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
          />
        </div>

        {error && <p className="text-xs" style={{ color: '#FF3B30' }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="text-sm font-medium rounded-xl px-6 py-2.5 transition-opacity disabled:opacity-50"
          style={{ background: '#000', color: '#fff' }}
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────

export default function EmployeePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) throw new Error('Failed to get user')
        const me = await meRes.json()

        const res = await fetch(`/api/reviews?reviewerId=${me.userId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAssignments(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleSubmitted(assignmentId: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}
      >
        Pending Reviews
      </h1>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      )}
      {error && (
        <p className="text-sm" style={{ color: '#FF3B30' }}>{error}</p>
      )}

      {!loading && !error && assignments.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: '#fff', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            All caught up — no pending reviews.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onSubmitted={handleSubmitted}
          />
        ))}
      </div>
    </div>
  )
}
