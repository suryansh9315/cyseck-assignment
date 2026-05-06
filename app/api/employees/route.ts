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

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const employees = await prisma.employee.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, email, role, password } = await req.json()

    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: 'name, email, role, and password are required' }, { status: 400 })
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!['admin', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'role must be admin or employee' }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const employee = await prisma.employee.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), role, password: hashed },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
