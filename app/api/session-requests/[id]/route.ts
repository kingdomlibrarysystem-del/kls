import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) {
    return NextResponse.json({ data: null, message: 'Session request not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeSessionRequest(sessionRequest), message: 'Session request fetched successfully', code: 'success', status: 200 })
}

const patchSessionRequestSchema = z.union([
  z.object({ action: z.literal('approve'), scheduledAt: z.string().datetime().optional(), notes: z.string().optional() }),
  z.object({ action: z.literal('reject'), notes: z.string().optional() }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.undefined() }).passthrough(),
])

/** Status-transition guard porting the mock's approveSession/rejectSession/completeSession. */
export const PATCH = withErrorHandling('/api/session-requests/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = patchSessionRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Session request not found', 404)

  if (body.action === 'approve') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending session request can be approved', 409)
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : existing.proposedTime
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'APPROVED', scheduledAt, notes: body.notes ?? existing.notes } })
    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request approved', code: 'success', status: 200 })
  }

  if (body.action === 'reject') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending session request can be rejected', 409)
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'REJECTED', notes: body.notes ?? existing.notes } })
    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request rejected', code: 'success', status: 200 })
  }

  if (body.action === 'complete') {
    if (existing.status !== 'APPROVED') throw new ApiError('Only an approved session can be completed', 409)
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'COMPLETED' } })
    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session marked complete', code: 'success', status: 200 })
  }

  const data: Record<string, unknown> = { ...body }
  delete data.action
  const updated = await prisma.sessionRequest.update({ where: { id }, data })
  return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request updated successfully', code: 'success', status: 200 })
})
