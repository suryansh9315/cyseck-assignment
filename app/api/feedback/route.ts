import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { assignmentId, rating, comments } = await req.json()

    if (!assignmentId || rating == null || !comments?.trim()) {
      return NextResponse.json(
        { error: 'assignmentId, rating, and comments are required' },
        { status: 400 },
      )
    }

    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'rating must be an integer between 1 and 5' }, { status: 400 })
    }

    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id: assignmentId },
      include: { review: { select: { status: true } } },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.reviewerId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (assignment.review.status !== 'open') {
      return NextResponse.json({ error: 'Review is closed' }, { status: 403 })
    }

    const feedback = await prisma.feedback.create({
      data: { assignmentId, rating: ratingNum, comments: comments.trim() },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Feedback already submitted for this assignment' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
