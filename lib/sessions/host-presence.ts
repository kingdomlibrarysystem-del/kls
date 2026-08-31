import prisma from '@/prisma/client'

/**
 * A presence row is considered "still in the room" if its last heartbeat
 * was within this window — matches the room UI's own heartbeat interval
 * (see use-session-presence.ts). Shared with
 * app/api/session-requests/[id]/presence/route.ts's serializePresence so
 * both routes agree on exactly the same staleness rule instead of each
 * defining their own copy.
 */
export const PRESENCE_STALE_AFTER_MS = 30_000

/**
 * Real server-side check for "is the hoster (lecturer/admin) actually
 * connected to this session's room right now" — the enforcement point for
 * gating a learner's join token until the host has arrived. A client-side-
 * only check would be trivially bypassable by calling the token route
 * directly, so this lives here rather than only in session-room-view.tsx.
 */
export async function isHostPresent(sessionRequestId: string): Promise<boolean> {
  const rows = await prisma.sessionPresence.findMany({
    where: { sessionRequestId, role: { in: ['LECTURER', 'ADMIN'] }, leftAt: null },
  })
  const now = Date.now()
  return rows.some((r) => now - r.lastSeenAt.getTime() <= PRESENCE_STALE_AFTER_MS)
}
