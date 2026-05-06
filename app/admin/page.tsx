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

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors'
const inputStyle = {
  background: '#F5F5F7',
  border: '1px solid transparent',
  color: 'var(--foreground)',
}

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid #1D1D1F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid transparent'
}

// ─── Employee Tab ─────────────────────────────────────────────────────────────

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'employee', password: '' })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

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

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</p>
  if (error) return <p className="text-sm py-8" style={{ color: '#FF3B30' }}>{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          Employees
        </h2>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError('') }}
          className="text-sm font-medium rounded-xl px-4 py-2 transition-opacity"
          style={{ background: showAdd ? '#F5F5F7' : '#000', color: showAdd ? 'var(--foreground)' : '#fff' }}
        >
          {showAdd ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 space-y-4"
          style={{ background: '#F5F5F7' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            New Employee
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Name</label>
              <input
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Password</label>
              <input
                type="password"
                required
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          </div>
          {addError && <p className="text-xs" style={{ color: '#FF3B30' }}>{addError}</p>}
          <button
            type="submit"
            disabled={adding}
            className="text-sm font-medium rounded-xl px-5 py-2.5 transition-opacity disabled:opacity-50"
            style={{ background: '#000', color: '#fff' }}
          >
            {adding ? 'Adding…' : 'Add Employee'}
          </button>
        </form>
      )}

      {employees.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>No employees yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Joined', ''].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-widest"
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <>
                  <tr
                    key={emp.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="py-3.5 pr-6 font-medium" style={{ color: 'var(--foreground)' }}>
                      {emp.name}
                    </td>
                    <td className="py-3.5 pr-6 text-sm" style={{ color: 'var(--muted)' }}>
                      {emp.email}
                    </td>
                    <td className="py-3.5 pr-6">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: emp.role === 'admin' ? '#1D1D1F' : '#F5F5F7',
                          color: emp.role === 'admin' ? '#fff' : 'var(--muted)',
                          border: emp.role === 'admin' ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-sm" style={{ color: 'var(--muted)' }}>
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(emp)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deletingId === emp.id}
                          className="text-xs font-medium disabled:opacity-40"
                          style={{ color: '#FF3B30' }}
                        >
                          {deletingId === emp.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingId === emp.id && (
                    <tr key={`${emp.id}-edit`}>
                      <td colSpan={5} className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <form
                          onSubmit={handleEdit}
                          className="rounded-2xl p-5 space-y-4"
                          style={{ background: '#F5F5F7' }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                            Edit Employee
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Name</label>
                              <input
                                required
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className={inputCls}
                                style={{ ...inputStyle, background: '#fff' }}
                                onFocus={focusInput}
                                onBlur={blurInput}
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
                              <input
                                type="email"
                                required
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className={inputCls}
                                style={{ ...inputStyle, background: '#fff' }}
                                onFocus={focusInput}
                                onBlur={blurInput}
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className={inputCls}
                                style={{ ...inputStyle, background: '#fff' }}
                                onFocus={focusInput}
                                onBlur={blurInput}
                              >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                                New Password{' '}
                                <span style={{ color: '#AEAEB2' }}>(leave blank to keep)</span>
                              </label>
                              <input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                className={inputCls}
                                style={{ ...inputStyle, background: '#fff' }}
                                onFocus={focusInput}
                                onBlur={blurInput}
                              />
                            </div>
                          </div>
                          {editError && <p className="text-xs" style={{ color: '#FF3B30' }}>{editError}</p>}
                          <div className="flex items-center gap-3">
                            <button
                              type="submit"
                              disabled={saving}
                              className="text-sm font-medium rounded-xl px-5 py-2.5 transition-opacity disabled:opacity-50"
                              style={{ background: '#000', color: '#fff' }}
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-sm font-medium"
                              style={{ color: 'var(--muted)' }}
                            >
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
        </div>
      )}
    </div>
  )
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

function ReviewsTab({ employees }: { employees: Employee[] }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const eligibleReviewers = employees.filter((e) => e.id !== createForm.employeeId)

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</p>
  if (error) return <p className="text-sm py-8" style={{ color: '#FF3B30' }}>{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          Reviews
        </h2>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError('') }}
          className="text-sm font-medium rounded-xl px-4 py-2 transition-opacity"
          style={{ background: showCreate ? '#F5F5F7' : '#000', color: showCreate ? 'var(--foreground)' : '#fff' }}
        >
          {showCreate ? 'Cancel' : '+ Create Review'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-5 space-y-5"
          style={{ background: '#F5F5F7' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            New Review
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                Employee being reviewed
              </label>
              <select
                required
                value={createForm.employeeId}
                onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value, reviewerIds: [] })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Period</label>
              <input
                required
                placeholder="e.g. Q1 2026"
                value={createForm.period}
                onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                className={inputCls}
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          </div>

          {createForm.employeeId && (
            <div>
              <label className="block text-xs mb-3" style={{ color: 'var(--muted)' }}>
                Reviewers{' '}
                <span style={{ color: '#AEAEB2' }}>(select at least one)</span>
              </label>
              {eligibleReviewers.length === 0 ? (
                <p className="text-xs" style={{ color: '#AEAEB2' }}>No other employees available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {eligibleReviewers.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2.5 text-sm cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                      style={{
                        background: createForm.reviewerIds.includes(emp.id) ? '#1D1D1F' : '#fff',
                        color: createForm.reviewerIds.includes(emp.id) ? '#fff' : 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={createForm.reviewerIds.includes(emp.id)}
                        onChange={() => toggleReviewer(emp.id)}
                        className="hidden"
                      />
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: createForm.reviewerIds.includes(emp.id) ? 'rgba(255,255,255,0.2)' : '#F5F5F7',
                          border: '1px solid',
                          borderColor: createForm.reviewerIds.includes(emp.id) ? 'transparent' : 'var(--border)',
                        }}
                      >
                        {createForm.reviewerIds.includes(emp.id) && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {emp.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {createError && <p className="text-xs" style={{ color: '#FF3B30' }}>{createError}</p>}
          <button
            type="submit"
            disabled={creating || createForm.reviewerIds.length === 0}
            className="text-sm font-medium rounded-xl px-5 py-2.5 transition-opacity disabled:opacity-50"
            style={{ background: '#000', color: '#fff' }}
          >
            {creating ? 'Creating…' : 'Create Review'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>No reviews yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Employee', 'Period', 'Status', 'Reviewers', 'Feedback', ''].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-widest"
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const submitted = review.assignments.filter((a) => a.feedback !== null).length
                return (
                  <tr key={review.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3.5 pr-6 font-medium" style={{ color: 'var(--foreground)' }}>
                      {review.employee.name}
                    </td>
                    <td className="py-3.5 pr-6 text-sm" style={{ color: 'var(--muted)' }}>
                      {review.period}
                    </td>
                    <td className="py-3.5 pr-6">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: review.status === 'open' ? '#E8FFF0' : '#F5F5F7',
                          color: review.status === 'open' ? '#1A7F3C' : 'var(--muted)',
                        }}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-sm" style={{ color: 'var(--muted)' }}>
                      {review.assignments.length}
                    </td>
                    <td className="py-3.5 pr-6 text-sm" style={{ color: 'var(--muted)' }}>
                      {submitted} / {review.assignments.length}
                    </td>
                    <td className="py-3.5">
                      <Link
                        href={`/admin/reviews/${review.id}`}
                        className="text-xs font-medium"
                        style={{ color: 'var(--foreground)' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
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
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}
      >
        Dashboard
      </h1>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: '#E8E8ED' }}
      >
        {(['employees', 'reviews'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 text-sm font-medium rounded-lg capitalize transition-all"
            style={{
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--foreground)' : 'var(--muted)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl p-7"
        style={{ background: '#fff', border: '1px solid var(--border)' }}
      >
        {tab === 'employees' && <EmployeesTab />}
        {tab === 'reviews' && <ReviewsTab employees={employees} />}
      </div>
    </div>
  )
}
