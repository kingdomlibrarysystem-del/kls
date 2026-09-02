import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/** Real RehabMilestone API — read-only from the member side (mirrors /api/health-records), staff-recorded via POST. */
function serializeMilestone(m: { id: string; userId: string; sessionId: string | null; recordedById: string; title: string; description: string; achievedAt: Date; recordedBy?: { name: string | null; firstName: string | null; lastName: string | null } }) {
  return {
    id: m.id,
    userId: m.userId,
    sessionId: m.sessionId,
    recordedById: m.recordedById,
    recordedByName: m.recordedBy ? (m.recordedBy.name ?? `${m.recordedBy.firstName ?? ''} ${m.recordedBy.lastName ?? ''}`.trim()) : undefined,
    title: m.title,
    description: m.description,
    achievedAt: m.achievedAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const milestones = await prisma.rehabMilestone.findMany({
    where: { userId },
    include: { recordedBy: { select: { name: true, firstName: true, lastName: true } } },
    orderBy: { achievedAt: 'desc' },
  })

  return NextResponse.json({ data: milestones.map(serializeMilestone), message: 'Milestones fetched successfully', code: 'success', status: 200 })
}

const recordMilestoneSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  recordedById: z.string().min(1, 'recordedById is required'),
  sessionId: z.string().trim().optional(),
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().trim().min(1, 'description is required'),
})

export const POST = withErrorHandling('/api/rehabilitation/progress', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = recordMilestoneSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const milestone = await prisma.rehabMilestone.create({
    data: { userId: body.userId, recordedById: body.recordedById, sessionId: body.sessionId || undefined, title: body.title, description: body.description },
    include: { recordedBy: { select: { name: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json({ data: serializeMilestone(milestone), message: 'Milestone recorded successfully', code: 'success', status: 201 }, { status: 201 })
})
