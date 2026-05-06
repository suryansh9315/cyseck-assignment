'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Employee = {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  createdAt: string
}

type Feedback = {
  id: string
  rating: number
  comments: string
  submittedAt: string
}

type Assignment = {
  id: string
  reviewer: { id: string; name: string; email: string }
  feedback: Feedback | null
}

type Review = {
  id: string
  period: string
  status: 'open' | 'closed'
  employee: { id: string; name: string; email: string }
  assignments: Assignment[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? '#FF9500' : '#E8E8ED', fontSize: '14px' }}>★</span>
      ))}
    </span>
  )
}

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors'
const inputStyle = {
  background: '#F5F5F7',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
}
function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid #1D1D1F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid var(--border)'
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [review, setReview] = useState<Review | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editPeriod, setEditPeriod] = useState('')
  const [editStatus, setEditStatus] = useState<'open' | 'closed'>('open')
  const [editReviewerIds, setEditReviewerIds] = useState<string[]>([])
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const [reviewRes, employeesRes] = await Promise.all([
        fetch(`/api/reviews?id=${id}`),
        fetch('/api/employees'),
      ])
      const reviewData = await reviewRes.json()
      const employeesData = await employeesRes.json()
      if (!reviewRes.ok) throw new Error(reviewData.error)
      setReview(reviewData)
      setEmployees(employeesData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  function startEdit() {
    if (!review) return
    setEditPeriod(review.period)
    setEditStatus(review.status)
    setEditReviewerIds(review.assignments.map((a) => a.reviewer.id))
    setSaveError('')
    setEditing(true)
  }

  function toggleReviewer(reviewerId: string) {
    setEditReviewerIds((prev) =>
      prev.includes(reviewerId)
        ? prev.filter((r) => r !== reviewerId)
        : [...prev, reviewerId],
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: editPeriod,
          status: editStatus,
          reviewerIds: editReviewerIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error); return }
      setReview(data)
      setEditing(false)
    } catch {
      setSaveError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <p className="text-sm" style={{ color: '#FF3B30' }}>{error || 'Review not found'}</p>
        <button
          onClick={() => router.push('/admin')}
          className="text-sm font-medium"
          style={{ color: 'var(--foreground)' }}
        >
          ← Back to dashboard
        </button>
      </div>
    )
  }

  const eligibleReviewers = employees.filter((e) => e.id !== review.employee.id)
  const submittedCount = review.assignments.filter((a) => a.feedback).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <Link
        href="/admin"
        className="text-sm font-medium inline-flex items-center gap-1"
        style={{ color: 'var(--muted)' }}
      >
        ← Dashboard
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}
          >
            {review.employee.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{review.period}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: review.status === 'open' ? '#E8FFF0' : '#F5F5F7',
              color: review.status === 'open' ? '#1A7F3C' : 'var(--muted)',
            }}
          >
            {review.status}
          </span>
          {!editing && (
            <button
              onClick={startEdit}
              className="text-sm font-medium rounded-xl px-4 py-2"
              style={{ background: '#000', color: '#fff' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: '#fff', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Edit Review
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Period</label>
              <input
                required
                value={editPeriod}
                onChange={(e) => setEditPeriod(e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, background: '#fff' }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'open' | 'closed')}
                className={inputCls}
                style={{ ...inputStyle, background: '#fff' }}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-3" style={{ color: 'var(--muted)' }}>Reviewers</label>
            <div className="grid grid-cols-2 gap-2">
              {eligibleReviewers.map((emp) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-2.5 text-sm cursor-pointer rounded-xl px-3 py-2.5"
                  style={{
                    background: editReviewerIds.includes(emp.id) ? '#1D1D1F' : '#fff',
                    color: editReviewerIds.includes(emp.id) ? '#fff' : 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editReviewerIds.includes(emp.id)}
                    onChange={() => toggleReviewer(emp.id)}
                    className="hidden"
                  />
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: editReviewerIds.includes(emp.id) ? 'rgba(255,255,255,0.2)' : '#F5F5F7',
                      border: '1px solid',
                      borderColor: editReviewerIds.includes(emp.id) ? 'transparent' : 'var(--border)',
                    }}
                  >
                    {editReviewerIds.includes(emp.id) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {emp.name}
                </label>
              ))}
            </div>
          </div>

          {saveError && <p className="text-xs" style={{ color: '#FF3B30' }}>{saveError}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || editReviewerIds.length === 0}
              className="text-sm font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#000', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm font-medium cursor-pointer hover:opacity-60 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: '#fff', border: '1px solid var(--border)' }}
      >
        <div className="flex items-baseline justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}
          >
            Reviewer Feedback
          </h2>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {submittedCount} / {review.assignments.length} submitted
          </span>
        </div>

        {review.assignments.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No reviewers assigned.</p>
        ) : (
          <div className="space-y-3">
            {review.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl p-4"
                style={{ background: '#F5F5F7' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {assignment.reviewer.name}
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: assignment.feedback ? '#E8FFF0' : '#FFF8E8',
                      color: assignment.feedback ? '#1A7F3C' : '#B8660A',
                    }}
                  >
                    {assignment.feedback ? 'Submitted' : 'Pending'}
                  </span>
                </div>

                {assignment.feedback ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Stars rating={assignment.feedback.rating} />
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {assignment.feedback.rating}/5
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                      {assignment.feedback.comments}
                    </p>
                    <p className="text-xs" style={{ color: '#AEAEB2' }}>
                      {new Date(assignment.feedback.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#AEAEB2' }}>No feedback submitted yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
