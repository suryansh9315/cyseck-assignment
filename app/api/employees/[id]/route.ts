import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { name, email, role, password } = await req.json()

    if (role && !['admin', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'role must be admin or employee' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name) data.name = name
    if (email) data.email = email
    if (role) data.role = role
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
