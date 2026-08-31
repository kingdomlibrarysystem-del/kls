import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { sessionApprovedEmailHtml, sessionRejectedEmailHtml, sessionUnavailableEmailHtml, sessionReminderEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) {
    return NextResponse.json({ data: null, message: 'Session request not found', code: 'error', status: 404 }, { status: 404 })
  }

  // Reachable by the learner, the assigned lecturer, or staff — the
  // session room itself fetches this to check the join window, so both
  // real participants need access, not just an owner-or-staff single check.
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const { userId, role } = auth.session
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'
  const isParticipant = userId === sessionRequest.learnerId || userId === sessionRequest.lecturerId
  if (!isStaff && !isParticipant) {
    return NextResponse.json({ data: null, message: "You don't have permission to do this.", code: 'error', status: 403 }, { status: 403 })
  }

  return NextResponse.json({ data: serializeSessionRequest(sessionRequest), message: 'Session request fetched successfully', code: 'success', status: 200 })
}

const patchSessionRequestSchema = z.union([
  z.object({
    action: z.literal('approve'),
    scheduledAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    /// Only meaningful (and only ever applied) when the request has no
    /// lecturerId yet — this is how an unassigned SCHEDULED request gets
    /// a real lecturer attached: the approver claims it. Ignored if the
    /// request already has a lecturer.
    lecturerId: z.string().min(1).optional(),
  }),
  z.object({ action: z.literal('reject'), notes: z.string().optional() }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('mark-unavailable'), notes: z.string().optional() }),
  z.object({ action: z.literal('notify') }),
])

/** Status-transition guard porting the mock's approveSession/rejectSession/completeSession. */
export const PATCH = withErrorHandling('/api/session-requests/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

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

    let lecturerFields: { lecturerId?: string; lecturerName?: string } = {}
    if (!existing.lecturerId && body.lecturerId) {
      const lecturer = await prisma.user.findUnique({ where: { id: body.lecturerId } })
      if (!lecturer) throw new ApiError('The specified lecturer does not exist', 400)
      lecturerFields = { lecturerId: lecturer.id, lecturerName: lecturer.name ?? `${lecturer.firstName ?? ''} ${lecturer.lastName ?? ''}`.trim() }
    } else if (!existing.lecturerId && !body.lecturerId) {
      throw new ApiError('This request has no lecturer assigned yet — provide a lecturerId to approve it', 400)
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: { status: 'APPROVED', scheduledAt, notes: body.notes ?? existing.notes, ...lecturerFields },
    })

    const sessionUrl = `${appBaseUrl()}/member/sessions/${updated.id}`
    await notifyUser({
      userId: updated.learnerId,
      type: 'SYSTEM',
      category: 'session-approved',
      title: 'Session approved',
      message: `Your session request for "${updated.courseTitle}" has been approved.`,
      href: `/member/sessions/${updated.id}`,
      email: { subject: 'Your session has been approved', html: sessionApprovedEmailHtml(updated.learnerName, updated.courseTitle, scheduledAt.toLocaleString(), sessionUrl) },
    })

    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request approved', code: 'success', status: 200 })
  }

  if (body.action === 'reject') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending session request can be rejected', 409)
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'REJECTED', notes: body.notes ?? existing.notes } })

    const sessionUrl = `${appBaseUrl()}/member/sessions/${updated.id}`
    await notifyUser({
      userId: updated.learnerId,
      type: 'SYSTEM',
      category: 'session-rejected',
      title: 'Session not approved',
      message: `Your session request for "${updated.courseTitle}" was not approved.`,
      href: `/member/sessions/${updated.id}`,
      email: { subject: 'Update on your session request', html: sessionRejectedEmailHtml(updated.learnerName, updated.courseTitle, sessionUrl) },
    })

    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request rejected', code: 'success', status: 200 })
  }

  if (body.action === 'complete') {
    if (existing.status !== 'APPROVED') throw new ApiError('Only an approved session can be completed', 409)
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'COMPLETED' } })
    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session marked complete', code: 'success', status: 200 })
  }

  if (body.action === 'mark-unavailable') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending session request can be marked unavailable', 409)
    const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'UNAVAILABLE', notes: body.notes ?? existing.notes } })

    const unavailableSessionUrl = `${appBaseUrl()}/member/sessions/${updated.id}`
    await notifyUser({
      userId: updated.learnerId,
      type: 'SYSTEM',
      category: 'session-unavailable',
      title: 'Session unavailable',
      message: `Your session request for "${updated.courseTitle}" is no longer available.`,
      href: `/member/sessions/${updated.id}`,
      email: { subject: 'Your session is no longer available', html: sessionUnavailableEmailHtml(updated.learnerName, updated.courseTitle, unavailableSessionUrl) },
    })

    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request marked unavailable', code: 'success', status: 200 })
  }

  if (body.action === 'notify') {
    if (existing.status !== 'APPROVED') throw new ApiError('Only an approved session can be notified', 409)

    const scheduledAtLabel = existing.scheduledAt ? existing.scheduledAt.toLocaleString() : null
    const learnerSessionUrl = `${appBaseUrl()}/member/sessions/${existing.id}`
    await notifyUser({
      userId: existing.learnerId,
      type: 'SYSTEM',
      category: 'session-reminder',
      title: 'Session reminder',
      message: `Reminder: your session for "${existing.courseTitle}" is scheduled${scheduledAtLabel ? ` for ${scheduledAtLabel}` : ''}.`,
      href: `/member/sessions/${existing.id}`,
      email: { subject: 'Reminder: your upcoming session', html: sessionReminderEmailHtml(existing.learnerName, existing.courseTitle, scheduledAtLabel, learnerSessionUrl) },
    })
    if (existing.lecturerId) {
      const lecturerRoomUrl = `${appBaseUrl()}/dashboard/e-learning/sessions/${existing.id}/room`
      await notifyUser({
        userId: existing.lecturerId,
        type: 'SYSTEM',
        category: 'session-reminder',
        title: 'Session reminder',
        message: `Reminder: you have a session for "${existing.courseTitle}" scheduled${scheduledAtLabel ? ` for ${scheduledAtLabel}` : ''}.`,
        href: `/dashboard/e-learning/sessions/${existing.id}/room`,
        email: { subject: 'Reminder: your upcoming session', html: sessionReminderEmailHtml(existing.lecturerName ?? 'there', existing.courseTitle, scheduledAtLabel, lecturerRoomUrl) },
      })
    }

    return NextResponse.json({ data: serializeSessionRequest(existing), message: 'Reminder sent to the learner and lecturer', code: 'success', status: 200 })
  }

  throw new ApiError('Unrecognized action', 400)
})
