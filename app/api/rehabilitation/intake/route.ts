import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/** Real RehabIntake API — member-initiated submission, staff-reviewed via [id]'s PATCH action-discriminator. */
function serializeIntake(i: {
  id: string
  userId: string
  concernArea: string
  history: string
  goals: string
  status: string
  reviewedById: string | null
  reviewNotes: string | null
  submittedAt: Date
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: i.id,
    userId: i.userId,
    memberName: i.user ? (i.user.name ?? `${i.user.firstName ?? ''} ${i.user.lastName ?? ''}`.trim()) : undefined,
    concernArea: i.concernArea,
    history: i.history,
    goals: i.goals,
    status: i.status,
    reviewedById: i.reviewedById,
    reviewNotes: i.reviewNotes,
    submittedAt: i.submittedAt.toISOString(),
  }
}

const LIST_INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } } } as const
const VALID_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'PLAN_CREATED', 'DECLINED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response

    const intakes = await prisma.rehabIntake.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json({ data: intakes.map(serializeIntake), message: 'Intakes fetched successfully', code: 'success', status: 200 })
  }

  const auth = await requireStaff()
  if (auth.response) return auth.response

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')

  const where = {
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && { status: status as 'SUBMITTED' | 'UNDER_REVIEW' | 'PLAN_CREATED' | 'DECLINED' }),
  }

  const [totalItems, intakes] = await Promise.all([
    prisma.rehabIntake.count({ where }),
    prisma.rehabIntake.findMany({
      where, include: LIST_INCLUDE, orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: intakes.map(serializeIntake),
    message: 'Intakes fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const submitIntakeSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  concernArea: z.string().trim().min(1, 'concernArea is required'),
  history: z.string().trim().min(1, 'history is required'),
  goals: z.string().trim().min(1, 'goals is required'),
})

export const POST = withErrorHandling('/api/rehabilitation/intake', 'POST', async (request: NextRequest) => {
  const parsed = submitIntakeSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const intake = await prisma.rehabIntake.create({
    data: { userId: body.userId, concernArea: body.concernArea, history: body.history, goals: body.goals, status: 'SUBMITTED' },
    include: LIST_INCLUDE,
  })

  return NextResponse.json({ data: serializeIntake(intake), message: 'Intake submitted successfully', code: 'success', status: 201 }, { status: 201 })
})
