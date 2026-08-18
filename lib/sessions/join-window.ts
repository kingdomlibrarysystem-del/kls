import type { SessionRequest } from './session-requests-data'

/** How early a learner/lecturer may enter the room before the scheduled time. */
export const JOIN_WINDOW_EARLY_MIN = 10
/** How long the room stays enterable after the scheduled time before it's considered missed. */
export const JOIN_WINDOW_LATE_GRACE_MIN = 30

export type JoinWindowState =
  | { canJoin: true }
  | { canJoin: false; reason: 'too-early'; opensAt: Date }
  | { canJoin: false; reason: 'too-late' }

/**
 * Real time-window enforcement for entering a session's room — previously
 * nonexistent (any request, in any status, could be entered at any time).
 * Only applies to SCHEDULED requests with a real scheduledAt; INSTANT
 * sessions have no meaningful "scheduled time" to gate against, and a
 * request still PENDING (never approved, so never given a scheduledAt)
 * has nothing to check against either — both stay always-joinable, same
 * as before.
 */
export function getJoinWindowState(request: Pick<SessionRequest, 'mode' | 'scheduledAt'>, now: Date = new Date()): JoinWindowState {
  if (request.mode === 'INSTANT' || !request.scheduledAt) return { canJoin: true }

  const scheduled = new Date(request.scheduledAt)
  const opensAt = new Date(scheduled.getTime() - JOIN_WINDOW_EARLY_MIN * 60_000)
  const closesAt = new Date(scheduled.getTime() + JOIN_WINDOW_LATE_GRACE_MIN * 60_000)

  if (now < opensAt) return { canJoin: false, reason: 'too-early', opensAt }
  if (now > closesAt) return { canJoin: false, reason: 'too-late' }
  return { canJoin: true }
}
