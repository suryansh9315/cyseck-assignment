'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Star display ─────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(rating)}
      <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [review, setReview] = useState<Review | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit form state
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
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-sm text-red-600">{error || 'Review not found'}</p>
        <button onClick={() => router.push('/admin')} className="mt-4 text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </button>
      </div>
    )
  }

  const eligibleReviewers = employees.filter((e) => e.id !== review.employee.id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {review.employee.name}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{review.period}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              review.status === 'open'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {review.status}
            </span>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Edit Review</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Period</label>
              <input
                required
                value={editPeriod}
                onChange={(e) => setEditPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'open' | 'closed')}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">Reviewers</label>
            <div className="grid grid-cols-2 gap-1.5">
              {eligibleReviewers.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editReviewerIds.includes(emp.id)}
                    onChange={() => toggleReviewer(emp.id)}
                    className="rounded"
                  />
                  {emp.name}
                </label>
              ))}
            </div>
          </div>

          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || editReviewerIds.length === 0}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviewer feedback table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base font-medium text-gray-800 mb-4">
          Reviewer Feedback
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({review.assignments.filter((a) => a.feedback).length} / {review.assignments.length} submitted)
          </span>
        </h2>

        {review.assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No reviewers assigned.</p>
        ) : (
          <div className="space-y-4">
            {review.assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-800">
                    {assignment.reviewer.name}
                  </span>
                  {assignment.feedback ? (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded">
                      Submitted
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>

                {assignment.feedback ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Stars rating={assignment.feedback.rating} />
                      <span className="text-xs text-gray-500">
                        {assignment.feedback.rating} / 5
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{assignment.feedback.comments}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(assignment.feedback.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No feedback yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
