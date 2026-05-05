'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Employee = {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  createdAt: string
}

type Review = {
  id: string
  period: string
  status: 'open' | 'closed'
  employee: { id: string; name: string }
  assignments: {
    id: string
    reviewer: { id: string; name: string }
    feedback: unknown | null
  }[]
}

// ─── Employee Tab ─────────────────────────────────────────────────────────────

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'employee', password: '' })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'employee', password: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchEmployees() {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmployees(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error); return }
      setAddForm({ name: '', email: '', role: 'employee', password: '' })
      setShowAdd(false)
      await fetchEmployees()
    } catch {
      setAddError('Something went wrong')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id)
    setEditForm({ name: emp.name, email: emp.email, role: emp.role, password: '' })
    setEditError('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setEditError('')
    setSaving(true)
    try {
      const body: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      }
      if (editForm.password) body.password = editForm.password
      const res = await fetch(`/api/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error); return }
      setEditingId(null)
      await fetchEmployees()
    } catch {
      setEditError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this employee? All their reviews and assignments will also be removed.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      await fetchEmployees()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading employees…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Employees</h2>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError('') }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showAdd ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">New Employee</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Role</label>
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Password</label>
              <input type="password" required value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <button type="submit" disabled={adding}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
            {adding ? 'Adding…' : 'Add Employee'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4">Joined</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => (
              <>
                <tr key={emp.id} className="py-2">
                  <td className="py-2 pr-4 font-medium text-gray-800">{emp.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{emp.email}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => startEdit(emp)}
                      className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(emp.id)} disabled={deletingId === emp.id}
                      className="text-xs text-red-500 hover:underline disabled:opacity-50">
                      {deletingId === emp.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>

                {/* Inline edit row */}
                {editingId === emp.id && (
                  <tr key={`${emp.id}-edit`}>
                    <td colSpan={5} className="py-3 bg-gray-50">
                      <form onSubmit={handleEdit} className="px-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name</label>
                            <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Email</label>
                            <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Role</label>
                            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="employee">Employee</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">New Password <span className="text-gray-400">(leave blank to keep)</span></label>
                            <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        {editError && <p className="text-xs text-red-600">{editError}</p>}
                        <div className="flex gap-2">
                          <button type="submit" disabled={saving}
                            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">No employees yet.</p>
        )}
      </div>
    </div>
  )
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

function ReviewsTab({ employees }: { employees: Employee[] }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ employeeId: '', period: '', reviewerIds: [] as string[] })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviews(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  function toggleReviewer(id: string) {
    setCreateForm((prev) => ({
      ...prev,
      reviewerIds: prev.reviewerIds.includes(id)
        ? prev.reviewerIds.filter((r) => r !== id)
        : [...prev.reviewerIds, id],
    }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error); return }
      setCreateForm({ employeeId: '', period: '', reviewerIds: [] })
      setShowCreate(false)
      await fetchReviews()
    } catch {
      setCreateError('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  // Employees eligible to be reviewers (excludes the selected subject)
  const eligibleReviewers = employees.filter((e) => e.id !== createForm.employeeId)

  if (loading) return <p className="text-sm text-gray-500">Loading reviews…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Reviews</h2>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError('') }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreate ? 'Cancel' : '+ Create Review'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">New Review</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Employee being reviewed</label>
              <select
                required
                value={createForm.employeeId}
                onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value, reviewerIds: [] })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Period</label>
              <input
                required
                placeholder="e.g. Q1 2026"
                value={createForm.period}
                onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {createForm.employeeId && (
            <div>
              <label className="block text-xs text-gray-600 mb-2">
                Reviewers <span className="text-gray-400">(select at least one)</span>
              </label>
              {eligibleReviewers.length === 0 ? (
                <p className="text-xs text-gray-400">No other employees available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {eligibleReviewers.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.reviewerIds.includes(emp.id)}
                        onChange={() => toggleReviewer(emp.id)}
                        className="rounded"
                      />
                      {emp.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <button
            type="submit"
            disabled={creating || createForm.reviewerIds.length === 0}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Review'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="pb-2 pr-4">Employee</th>
              <th className="pb-2 pr-4">Period</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Reviewers</th>
              <th className="pb-2 pr-4">Feedback</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const submitted = review.assignments.filter((a) => a.feedback !== null).length
              return (
                <tr key={review.id}>
                  <td className="py-2 pr-4 font-medium text-gray-800">{review.employee.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{review.period}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      review.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{review.assignments.length}</td>
                  <td className="py-2 pr-4 text-gray-600">{submitted} / {review.assignments.length}</td>
                  <td className="py-2">
                    <Link href={`/admin/reviews/${review.id}`}
                      className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {reviews.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">No reviews yet.</p>
        )}
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<'employees' | 'reviews'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['employees', 'reviews'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {tab === 'employees' && <EmployeesTab />}
        {tab === 'reviews' && <ReviewsTab employees={employees} />}
      </div>
    </div>
  )
}
