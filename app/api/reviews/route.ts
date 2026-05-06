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

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const reviewerId = searchParams.get('reviewerId')
  const reviewId = searchParams.get('id')

  if (reviewId) {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: reviewInclude,
    })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    return NextResponse.json(review)
  }

  if (reviewerId) {
    if (reviewerId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const assignments = await prisma.reviewAssignment.findMany({
      where: { reviewerId, feedback: null, review: { status: 'open' } },
      include: {
        review: {
          include: {
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })
    return NextResponse.json(assignments)
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reviews = await prisma.review.findMany({
    include: reviewInclude,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { employeeId, period, reviewerIds } = await req.json()

    if (!employeeId || !period || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: 'employeeId, period, and at least one reviewerId are required' },
        { status: 400 },
      )
    }

    if (typeof period !== 'string' || period.trim().length === 0) {
      return NextResponse.json({ error: 'period must be a non-empty string' }, { status: 400 })
    }

    if (reviewerIds.includes(employeeId)) {
      return NextResponse.json({ error: 'Employee cannot review themselves' }, { status: 400 })
    }

    const allIds = [...new Set([employeeId, ...reviewerIds])]
    const found = await prisma.employee.findMany({
      where: { id: { in: allIds } },
      select: { id: true },
    })
    if (found.length !== allIds.length) {
      return NextResponse.json({ error: 'One or more employee IDs are invalid' }, { status: 400 })
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { employeeId, period: period.trim() },
      })
      await tx.reviewAssignment.createMany({
        data: reviewerIds.map((reviewerId: string) => ({
          reviewId: created.id,
          reviewerId,
        })),
      })
      return tx.review.findUnique({ where: { id: created.id }, include: reviewInclude })
    })

    return NextResponse.json(review, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
