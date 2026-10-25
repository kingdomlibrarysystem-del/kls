import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { serializeSession, DETAIL_INCLUDE } from '@/lib/data/counseling-sessions'
import { isObjectId } from '@/lib/server/object-id'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Session not found', 404)
  const s = await prisma.counselingSession.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!s) throw new ApiError('Session not found', 404)
  return s
}

export const GET = withErrorHandling('/api/counseling/sessions/[id]', 'GET', async (_request: NextRequest, { params }: Ctx) => {
  const session = await find((await params).id)
  const auth = await requireOwnerOrStaff(session.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeSession(session), message: 'Session fetched successfully', code: 'success', status: 200 })
})

const schema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']),
  /** Staff: video link or place, sent with the confirmation. */
  meetingDetails: z.string().trim().max(500).optional(),
  /** Staff: a message to the member. Member: why they cancel. */
  note: z.string().trim().max(1000).optional(),
  /** Staff may move the time when confirming. */
  proposedTime: z.string().datetime().optional(),
})

/**
 * PATCH /api/counseling/sessions/[id] { status, meetingDetails?, note?, proposedTime? }
 * The member can cancel their own pending/confirmed session; staff confirm
 * (optionally moving the time and adding the call/video/place details),
 * complete or cancel it. The member is notified of every staff decision.
 */
export const PATCH = withErrorHandling('/api/counseling/sessions/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const existing = await find((await params).id)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = body.status === 'CANCELLED' ? await requireOwnerOrStaff(existing.userId) : await requireStaff()
  if (auth.response) return auth.response
  const byMember = auth.session.userId === existing.userId && auth.session.role === 'member'

  if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') throw new ApiError(`This session is already ${existing.status.toLowerCase()}`, 409)
  if (body.status === 'COMPLETED' && existing.status !== 'CONFIRMED') throw new ApiError('Confirm the session before marking it completed', 409)

  const updated = await prisma.counselingSession.update({
    where: { id: existing.id },
    data: {
      status: body.status,
      ...(body.meetingDetails !== undefined && { meetingDetails: body.meetingDetails || null }),
      ...(body.note !== undefined && { staffNote: body.note || null }),
      ...(body.proposedTime && { proposedTime: new Date(body.proposedTime) }),
    },
    include: DETAIL_INCLUDE,
  })

  if (!byMember) {
    const when = updated.proposedTime.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kigali' })
    const text = body.status === 'CONFIRMED'
      ? `Your session with ${updated.counselor.name} is confirmed for ${when}${updated.mode === 'PHONE' ? ` — we will call ${updated.contactPhone}` : updated.meetingDetails ? ` — ${updated.meetingDetails}` : ''}.`
      : body.status === 'CANCELLED'
        ? `Your session with ${updated.counselor.name} on ${when} was cancelled${body.note ? `: ${body.note}` : '.'}`
        : `Your session with ${updated.counselor.name} is marked completed. We are glad you reached out.`
    await notifyUser({
      userId: updated.userId, type: 'SYSTEM',
      category: body.status === 'CONFIRMED' ? 'session-approved' : body.status === 'CANCELLED' ? 'session-unavailable' : 'session-reminder',
      title: body.status === 'CONFIRMED' ? 'Counseling session confirmed' : body.status === 'CANCELLED' ? 'Counseling session cancelled' : 'Counseling session completed',
      message: text, href: '/member/care/counseling',
    }).catch(() => {})
  }

  return NextResponse.json({ data: serializeSession(updated), message: body.status === 'CANCELLED' ? 'Session cancelled' : 'Session updated', code: 'success', status: 200 })
})
