import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one special character.'
  return null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { name, email, role, password } = await req.json()

    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (password) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 })
      }
    }

    const target = await prisma.employee.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!target) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (target.role === 'admin' && id !== user.userId) {
      return NextResponse.json({ error: 'Cannot edit another admin account' }, { status: 403 })
    }

    if (role && role !== target.role) {
      if (target.role === 'admin') {
        return NextResponse.json({ error: 'Admin role cannot be changed' }, { status: 403 })
      }
      if (!['admin', 'employee'].includes(role)) {
        return NextResponse.json({ error: 'role must be admin or employee' }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = {}
    if (name) data.name = name.trim()
    if (email) data.email = email.trim().toLowerCase()
    if (role && target.role !== 'admin') data.role = role
    if (password) data.password = await bcrypt.hash(password, 10)

    const employee = await prisma.employee.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    return NextResponse.json(employee)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === user.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 })
  }

  const target = await prisma.employee.findUnique({ where: { id }, select: { role: true } })
  if (!target) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  if (target.role === 'admin') {
    return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 403 })
  }

  try {
    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
