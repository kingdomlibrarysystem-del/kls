import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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
  lecturerId: string
  lecturerName: string
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
    lecturerId: s.lecturerId,
    lecturerName: s.lecturerName,
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

/** mode: INSTANT creates directly as APPROVED (skips PENDING/approval, mirroring mockSessionRequests' startInstantSession — there's no one to approve a session that's already starting). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.learnerId || !body.lecturerId || !body.courseId || !body.proposedTime) {
      return NextResponse.json({ data: null, message: 'Missing required fields: learnerId, lecturerId, courseId, proposedTime', code: 'error', status: 400 }, { status: 400 })
    }
    const [learner, lecturer, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.learnerId } }),
      prisma.user.findUnique({ where: { id: body.lecturerId } }),
      prisma.course.findUnique({ where: { id: body.courseId } }),
    ])
    if (!learner) return NextResponse.json({ data: null, message: 'The specified learner does not exist', code: 'error', status: 400 }, { status: 400 })
    if (!lecturer) return NextResponse.json({ data: null, message: 'The specified lecturer does not exist', code: 'error', status: 400 }, { status: 400 })
    if (!course) return NextResponse.json({ data: null, message: 'The specified course does not exist', code: 'error', status: 400 }, { status: 400 })

    const isInstant = body.mode === 'INSTANT'
    const proposedTime = new Date(body.proposedTime)
    const sessionRequest = await prisma.sessionRequest.create({
      data: {
        learnerId: body.learnerId,
        learnerName: learner.name ?? `${learner.firstName ?? ''} ${learner.lastName ?? ''}`.trim(),
        lecturerId: body.lecturerId,
        lecturerName: lecturer.name ?? `${lecturer.firstName ?? ''} ${lecturer.lastName ?? ''}`.trim(),
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
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create session request', code: 'error', status: 500 }, { status: 500 })
  }
}
