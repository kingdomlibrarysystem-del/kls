import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

const createSessionRequestSchema = z.object({
  learnerId: z.string().min(1, 'learnerId is required'),
  /// Required for INSTANT (someone must actually be present right now);
  /// optional for SCHEDULED, where an unassigned request is valid and
  /// gets a lecturer attached at approval time (see the [id] route's
  /// `approve` action). Enforced by mode below, not by the field itself.
  lecturerId: z.string().min(1).optional(),
  courseId: z.string().min(1, 'courseId is required'),
  proposedTime: z.string().datetime({ message: 'proposedTime must be a valid ISO datetime' }),
  mode: z.enum(['SCHEDULED', 'INSTANT']).optional(),
  notes: z.string().trim().max(2000).optional(),
})

/**
 * Real SessionRequest API, replacing lib/sessions/session-requests-data.ts.
 * Migrated as part of Phase 5 (not deferred to the migration plan's
 * Phase 7 grouping) since this feature was confirmed to have zero
 * cross-imports with lib/messaging — a self-contained course/lecturer
 * booking feature, and courseId is a hard dependency on the real Course
 * collection this phase creates.
 */
function serializeSessionRequest(s: {
  id: string
  learnerId: string
  learnerName: string
  lecturerId: string | null
  lecturerName: string | null
  courseId: string
  courseTitle: string
  requestedAt: Date
  proposedTime: Date
  status: string
  mode: string
  scheduledAt: Date | null
  notes: string | null
}) {
  return {
    id: s.id,
    learnerId: s.learnerId,
    learnerName: s.learnerName,
    lecturerId: s.lecturerId ?? undefined,
    lecturerName: s.lecturerName ?? undefined,
    courseId: s.courseId,
    courseTitle: s.courseTitle,
    requestedAt: s.requestedAt.toISOString().split('T')[0],
    proposedTime: s.proposedTime.toISOString(),
    status: s.status,
    mode: s.mode,
    scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : undefined,
    notes: s.notes ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const learnerId = searchParams.get('learnerId')
  const lecturerId = searchParams.get('lecturerId')
  const status = searchParams.get('status')

  // learnerId is "my session requests" (member) — ownership check. There's
  // no separate lecturer portal (lecturers work through the shared admin
  // dashboard), so a lecturerId-only filter or no filter at all is staff.
  const auth = await (learnerId ? requireOwnerOrStaff(learnerId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(learnerId && { learnerId }),
    ...(lecturerId && { lecturerId }),
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' }),
  }

  const [totalItems, requests] = await Promise.all([
    prisma.sessionRequest.count({ where }),
    prisma.sessionRequest.findMany({ where, orderBy: { requestedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: requests.map(serializeSessionRequest),
    message: 'Session requests fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

/**
 * mode: INSTANT creates directly as APPROVED (skips PENDING/approval,
 * mirroring mockSessionRequests' startInstantSession — there's no one to
 * approve a session that's already starting), and REQUIRES a lecturerId
 * — an instant session needs someone actually present right now. mode:
 * SCHEDULED allows lecturerId to be omitted; the request is created
 * PENDING with no lecturer attached, to be claimed at approval time.
 */
export const POST = withErrorHandling('/api/session-requests', 'POST', async (request: NextRequest) => {
  const parsed = createSessionRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data
  const isInstant = body.mode === 'INSTANT'

  const auth = await requireOwnerOrStaff(body.learnerId)
  if (auth.response) return auth.response

  if (isInstant && !body.lecturerId) {
    throw new ApiError('lecturerId is required to start an instant session', 400)
  }

  const [learner, lecturer, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.learnerId } }),
    body.lecturerId ? prisma.user.findUnique({ where: { id: body.lecturerId } }) : Promise.resolve(null),
    prisma.course.findUnique({ where: { id: body.courseId } }),
  ])
  if (!learner) throw new ApiError('The specified learner does not exist', 400)
  if (body.lecturerId && !lecturer) throw new ApiError('The specified lecturer does not exist', 400)
  if (!course) throw new ApiError('The specified course does not exist', 400)

  const authRole = auth.session!.role
  const isStaff = authRole === 'admin' || authRole === 'manager' || authRole === 'staff'
  if (!isStaff) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: body.learnerId, courseId: body.courseId } },
    })
    if (!enrollment) throw new ApiError('You must be enrolled in this course to request a session', 403)
  }

  const proposedTime = new Date(body.proposedTime)
  const sessionRequest = await prisma.sessionRequest.create({
    data: {
      learnerId: body.learnerId,
      learnerName: learner.name ?? `${learner.firstName ?? ''} ${learner.lastName ?? ''}`.trim(),
      lecturerId: lecturer?.id ?? null,
      lecturerName: lecturer ? (lecturer.name ?? `${lecturer.firstName ?? ''} ${lecturer.lastName ?? ''}`.trim()) : null,
      courseId: body.courseId,
      courseTitle: course.title,
      proposedTime,
      mode: isInstant ? 'INSTANT' : 'SCHEDULED',
      status: isInstant ? 'APPROVED' : 'PENDING',
      scheduledAt: isInstant ? proposedTime : null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json({ data: serializeSessionRequest(sessionRequest), message: 'Session request created successfully', code: 'success', status: 201 }, { status: 201 })
})
