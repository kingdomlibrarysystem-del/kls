import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { PRESENCE_STALE_AFTER_MS as STALE_AFTER_MS } from '@/lib/sessions/host-presence'

function serializePresence(p: {
  id: string
  sessionRequestId: string
  userId: string | null
  displayName: string
  role: string
  joinedAt: Date
  lastSeenAt: Date
  leftAt: Date | null
}) {
  const isStale = !p.leftAt && Date.now() - p.lastSeenAt.getTime() > STALE_AFTER_MS
  return {
    id: p.id,
    sessionRequestId: p.sessionRequestId,
    userId: p.userId ?? undefined,
    displayName: p.displayName,
    role: p.role.toLowerCase(),
    joinedAt: p.joinedAt.toISOString(),
    lastSeenAt: p.lastSeenAt.toISOString(),
    /// A stale, never-explicitly-left row reads as "not present" to
    /// callers (present: false) without being deleted — the room's own
    /// heartbeat will revive it (bump lastSeenAt) if the tab is in fact
    /// still open, and a genuinely abandoned row simply ages out of the
    /// "present" set rather than needing a cleanup job.
    present: !p.leftAt && !isStale,
  }
}

/**
 * Real role for this caller in this session's room, derived server-side
 * from SessionRequest.lecturerId and the caller's own account role —
 * never trusted from client input, since it's the enforcement input for
 * isHostPresent()'s "wait for host" gate.
 */
function resolvePresenceRole(sessionRequest: { lecturerId: string | null }, userId: string, accountRole: string): 'LEARNER' | 'LECTURER' | 'ADMIN' {
  if (accountRole === 'admin' || accountRole === 'manager' || accountRole === 'staff') return 'ADMIN'
  if (userId === sessionRequest.lecturerId) return 'LECTURER'
  return 'LEARNER'
}

/** GET — real roster of who is currently present in this room (used by the participant panel to distinguish invited-but-never-joined from actually-here). Restricted to the session's own participants/staff, matching GET /api/session-requests/[id]. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) {
    return NextResponse.json({ data: null, message: 'Session request not found', code: 'error', status: 404 }, { status: 404 })
  }

  const { userId, role } = auth.session
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'
  const isParticipant = userId === sessionRequest.learnerId || userId === sessionRequest.lecturerId
  if (!isStaff && !isParticipant) {
    return NextResponse.json({ data: null, message: "You don't have permission to do this.", code: 'error', status: 403 }, { status: 403 })
  }

  const rows = await prisma.sessionPresence.findMany({ where: { sessionRequestId: id }, orderBy: { joinedAt: 'asc' } })
  return NextResponse.json({ data: rows.map(serializePresence), message: 'Presence fetched successfully', code: 'success', status: 200 })
}

const joinSchema = z.object({
  userId: z.string().optional(),
  displayName: z.string().trim().min(1, 'displayName is required'),
})

/** POST — a real join event: creates (or revives, if this same user already had a row) a presence record for the room. */
export const POST = withErrorHandling('/api/session-requests/[id]/presence', 'POST', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = joinSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  // A caller can only ever report presence as themselves, never impersonate another userId.
  if (body.userId && body.userId !== auth.session.userId) {
    return NextResponse.json({ data: null, message: "You can only join as yourself.", code: 'error', status: 403 }, { status: 403 })
  }

  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) throw new ApiError('Session request not found', 404)

  const resolvedRole = resolvePresenceRole(sessionRequest, auth.session.userId, auth.session.role)

  const existing = body.userId
    ? await prisma.sessionPresence.findFirst({ where: { sessionRequestId: id, userId: body.userId, leftAt: null } })
    : null

  const row = existing
    ? await prisma.sessionPresence.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), role: resolvedRole } })
    : await prisma.sessionPresence.create({
        data: { sessionRequestId: id, userId: body.userId ?? null, displayName: body.displayName, role: resolvedRole },
      })

  return NextResponse.json({ data: serializePresence(row), message: 'Joined session', code: 'success', status: 201 }, { status: existing ? 200 : 201 })
})

const heartbeatSchema = z.object({ presenceId: z.string().min(1, 'presenceId is required') })

/** PATCH — heartbeat ping while the room stays open, so a live presence row doesn't age into "stale." */
export const PATCH = withErrorHandling('/api/session-requests/[id]/presence', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = heartbeatSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.sessionPresence.findUnique({ where: { id: parsed.data.presenceId } })
  if (!existing || existing.sessionRequestId !== id) throw new ApiError('Presence row not found', 404)

  const updated = await prisma.sessionPresence.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } })
  return NextResponse.json({ data: serializePresence(updated), message: 'Heartbeat recorded', code: 'success', status: 200 })
})

const leaveSchema = z.object({ presenceId: z.string().min(1, 'presenceId is required') })

/**
 * DELETE — real leave, used both for a participant's own "Leave" and for
 * a host removing someone else from the call. Doesn't hard-delete the
 * row (see SessionPresence's docstring) — sets leftAt so the room's join
 * history stays real and inspectable.
 */
export const DELETE = withErrorHandling('/api/session-requests/[id]/presence', 'DELETE', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const parsed = leaveSchema.safeParse({ presenceId: searchParams.get('presenceId') })
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.sessionPresence.findUnique({ where: { id: parsed.data.presenceId } })
  if (!existing || existing.sessionRequestId !== id) throw new ApiError('Presence row not found', 404)

  // A caller may always remove their own presence row (leave). Removing
  // someone else's (kick) requires being this session's real host —
  // the same lecturerId/staff-role check livekit-token/route.ts uses,
  // never the client-supplied role the roster itself stores.
  if (existing.userId !== auth.session.userId) {
    const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
    if (!sessionRequest) throw new ApiError('Session request not found', 404)
    const { userId, role } = auth.session
    const isHoster = userId === sessionRequest.lecturerId || role === 'admin' || role === 'manager' || role === 'staff'
    if (!isHoster) {
      return NextResponse.json({ data: null, message: "You don't have permission to do this.", code: 'error', status: 403 }, { status: 403 })
    }
  }

  await prisma.sessionPresence.update({ where: { id: existing.id }, data: { leftAt: new Date() } })
  return NextResponse.json({ data: null, message: 'Left session', code: 'success', status: 200 })
})
