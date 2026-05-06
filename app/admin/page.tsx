'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmailPassword(email: string, password: string): string {
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one special character.'
  return ''
}

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors'
const inputOnWhite = {
  background: '#fff',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
}

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid #1D1D1F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid var(--border)'
}

function DeleteModal({
  employeeName,
  onConfirm,
  onCancel,
  deleting,
}: {
  employeeName: string
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  const [input, setInput] = useState('')
  const match = input === employeeName

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 100, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl p-7 space-y-5"
        style={{ background: '#fff', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Delete employee
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            This will permanently delete <span className="font-medium" style={{ color: 'var(--foreground)' }}>{employeeName}</span> along
            with all their reviews and assignments. This action cannot be undone.
          </p>
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
            Type <span className="font-medium" style={{ color: 'var(--foreground)' }}>{employeeName}</span> to confirm
          </label>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={employeeName}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            style={{ background: '#F5F5F7', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid #FF3B30')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid var(--border)')}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            disabled={!match || deleting}
            className="text-sm font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#FF3B30', color: '#fff' }}
          >
            {deleting ? 'Deleting…' : 'Delete employee'}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="text-sm font-medium cursor-pointer hover:opacity-60 transition-opacity disabled:opacity-40"
            style={{ color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EmployeesTab({ currentUserId }: { currentUserId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'employee', password: '' })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAddPassword, setShowAddPassword] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'employee', password: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
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
    const validationError = validateEmailPassword(addForm.email, addForm.password)
    if (validationError) { setAddError(validationError); return }
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
    if (editForm.password) {
      const validationError = validateEmailPassword(editForm.email, editForm.password)
      if (validationError) { setEditError(validationError); return }
    } else {
      if (!EMAIL_RE.test(editForm.email)) { setEditError('Enter a valid email address.'); return }
    }
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

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      await fetch(`/api/employees/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
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
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium rounded-xl px-4 py-2 cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: '#000', color: '#fff' }}
          >
            + Add Employee
          </button>
        )}
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
                style={inputOnWhite}
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
                style={inputOnWhite}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className={`${inputCls} cursor-pointer`}
                style={inputOnWhite}
                onFocus={focusInput}
                onBlur={blurInput}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                Password{' '}
                <span style={{ color: '#AEAEB2' }}>(min 8 chars, 1 number, 1 special)</span>
              </label>
              <div className="relative">
                <input
                  type={showAddPassword ? 'text' : 'password'}
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className={`${inputCls} pr-10`}
                  style={inputOnWhite}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-60"
                  style={{ color: 'var(--muted)' }}
                  tabIndex={-1}
                >
                  <EyeIcon open={showAddPassword} />
                </button>
              </div>
            </div>
          </div>
          {addError && <p className="text-xs" style={{ color: '#FF3B30' }}>{addError}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={adding || !addForm.name.trim() || !EMAIL_RE.test(addForm.email) || validateEmailPassword(addForm.email, addForm.password) !== ''}
              className="text-sm font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#000', color: '#fff' }}
            >
              {adding ? 'Adding…' : 'Add Employee'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddError('') }}
              className="text-sm font-medium cursor-pointer hover:opacity-75 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
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
              {employees.map((emp, index) => {
                const isLast = index === employees.length - 1
                const isEditLast = editingId === emp.id && isLast
                return (
                  <>
                    <tr
                      key={emp.id}
                      style={{ borderBottom: (isLast && editingId !== emp.id) ? 'none' : '1px solid var(--border)' }}
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
                          {(emp.role === 'employee' || emp.id === currentUserId) && (
                            <button
                              onClick={() => startEdit(emp)}
                              className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity"
                              style={{ color: 'var(--foreground)' }}
                            >
                              Edit
                            </button>
                          )}
                          {emp.role === 'employee' && (
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              disabled={deletingId === emp.id}
                              className="text-xs font-medium cursor-pointer hover:opacity-60 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ color: '#FF3B30' }}
                            >
                              {deletingId === emp.id ? '…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {editingId === emp.id && (
                      <tr key={`${emp.id}-edit`}>
                        <td colSpan={5} className="py-4" style={{ borderBottom: isEditLast ? 'none' : '1px solid var(--border)' }}>
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
                                  style={inputOnWhite}
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
                                  style={inputOnWhite}
                                  onFocus={focusInput}
                                  onBlur={blurInput}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
                                {emp.role === 'admin' ? (
                                  <div
                                    className="w-full rounded-xl px-4 py-2.5 text-sm"
                                    style={{
                                      background: '#F0F0F2',
                                      border: '1px solid var(--border)',
                                      color: 'var(--muted)',
                                    }}
                                  >
                                    Admin{' '}
                                    <span style={{ color: '#AEAEB2', fontSize: '11px' }}>(cannot change)</span>
                                  </div>
                                ) : (
                                  <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className={`${inputCls} cursor-pointer`}
                                    style={inputOnWhite}
                                    onFocus={focusInput}
                                    onBlur={blurInput}
                                  >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
                                  New Password{' '}
                                  <span style={{ color: '#AEAEB2' }}>(leave blank to keep)</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type={showEditPassword ? 'text' : 'password'}
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    className={`${inputCls} pr-10`}
                                    style={inputOnWhite}
                                    onFocus={focusInput}
                                    onBlur={blurInput}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowEditPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-60"
                                    style={{ color: 'var(--muted)' }}
                                    tabIndex={-1}
                                  >
                                    <EyeIcon open={showEditPassword} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {editError && <p className="text-xs" style={{ color: '#FF3B30' }}>{editError}</p>}
                            <div className="flex items-center gap-3">
                              <button
                                type="submit"
                                disabled={saving || !editForm.name.trim() || !EMAIL_RE.test(editForm.email) || (editForm.password !== '' && validateEmailPassword(editForm.email, editForm.password) !== '')}
                                className="text-sm font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: '#000', color: '#fff' }}
                              >
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-sm font-medium cursor-pointer hover:opacity-60 transition-opacity"
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          employeeName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deletingId === deleteTarget.id}
        />
      )}
    </div>
  )
}

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
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium rounded-xl px-4 py-2 cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: '#000', color: '#fff' }}
          >
            + Create Review
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-5 space-y-4"
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
                className={`${inputCls} cursor-pointer`}
                style={inputOnWhite}
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
                style={inputOnWhite}
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
                  {eligibleReviewers.map((emp) => {
                    const selected = createForm.reviewerIds.includes(emp.id)
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2.5 text-sm cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                        style={{
                          background: selected ? '#1D1D1F' : '#fff',
                          color: selected ? '#fff' : 'var(--foreground)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleReviewer(emp.id)}
                          className="hidden"
                        />
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            background: selected ? 'rgba(255,255,255,0.2)' : '#F5F5F7',
                            border: '1px solid',
                            borderColor: selected ? 'transparent' : 'var(--border)',
                          }}
                        >
                          {selected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {emp.name}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {createError && <p className="text-xs" style={{ color: '#FF3B30' }}>{createError}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || createForm.reviewerIds.length === 0}
              className="text-sm font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#000', color: '#fff' }}
            >
              {creating ? 'Creating…' : 'Create Review'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError('') }}
              className="text-sm font-medium cursor-pointer hover:opacity-60 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
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
              {reviews.map((review, index) => {
                const submitted = review.assignments.filter((a) => a.feedback !== null).length
                const isLast = index === reviews.length - 1
                return (
                  <tr key={review.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
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
                        className="text-xs font-medium hover:opacity-60 transition-opacity"
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

export default function AdminPage() {
  const [tab, setTab] = useState<'employees' | 'reviews'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => { })
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.userId) setCurrentUserId(d.userId) })
      .catch(() => { })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}
      >
        Dashboard
      </h1>

      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: '#E8E8ED' }}
      >
        {(['employees', 'reviews'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 text-sm font-medium rounded-lg capitalize cursor-pointer transition-all"
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
        {tab === 'employees' && <EmployeesTab currentUserId={currentUserId} />}
        {tab === 'reviews' && <ReviewsTab employees={employees} />}
      </div>
    </div>
  )
}
