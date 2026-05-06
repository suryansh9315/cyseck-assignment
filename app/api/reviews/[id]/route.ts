import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const reviewInclude = {
  employee: { select: { id: true, name: true, email: true } },
  assignments: {
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      feedback: true,
    },
  },
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { period, status, reviewerIds, employeeId } = await req.json()

    if (status && !['open', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'status must be open or closed' }, { status: 400 })
    }

    if (period !== undefined && (typeof period !== 'string' || period.trim().length === 0)) {
      return NextResponse.json({ error: 'period must be a non-empty string' }, { status: 400 })
    }

    if (Array.isArray(reviewerIds) && reviewerIds.length > 0) {
      const found = await prisma.employee.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true },
      })
      if (found.length !== reviewerIds.length) {
        return NextResponse.json({ error: 'One or more reviewer IDs are invalid' }, { status: 400 })
      }
    }

    const review = await prisma.$transaction(async (tx) => {
      const current = await tx.review.findUnique({ where: { id } })
      if (!current) throw Object.assign(new Error('Not found'), { code: 'P2025' })

      const subjectId = employeeId ?? current.employeeId

      if (reviewerIds !== undefined) {
        if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
          throw Object.assign(new Error('At least one reviewer required'), { code: 'NO_REVIEWERS' })
        }
        if (reviewerIds.includes(subjectId)) {
          throw Object.assign(new Error('Self-review'), { code: 'SELF_REVIEW' })
        }
        await tx.reviewAssignment.deleteMany({ where: { reviewId: id } })
        await tx.reviewAssignment.createMany({
          data: reviewerIds.map((reviewerId: string) => ({ reviewId: id, reviewerId })),
        })
      }

      const data: Record<string, unknown> = {}
      if (period) data.period = period.trim()
      if (status) data.status = status
      if (employeeId) data.employeeId = employeeId

      return tx.review.update({
        where: { id },
        data,
        include: reviewInclude,
      })
    })

    return NextResponse.json(review)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      if (err.code === 'SELF_REVIEW') return NextResponse.json({ error: 'Employee cannot review themselves' }, { status: 400 })
      if (err.code === 'NO_REVIEWERS') return NextResponse.json({ error: 'At least one reviewer is required' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
