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
          className="text-2xl leading-none focus:outline-none"
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
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
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">
          Review for {assignment.review.employee.name}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{assignment.review.period}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
          <textarea
            required
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your feedback…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Pending Reviews</h1>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && assignments.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">You have no pending reviews.</p>
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
