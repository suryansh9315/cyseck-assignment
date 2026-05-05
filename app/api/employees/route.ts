import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    if (!['admin', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'role must be admin or employee' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const employee = await prisma.employee.create({
      data: { name, email, role, password: hashed },
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
