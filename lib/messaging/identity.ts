import type { UserRole } from '@/contexts/auth-context'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'

/**
 * This mock has a single live member persona — see use-enrollments.ts's
 * CURRENT_MEMBER_NAME. Duplicated here (not imported) because that
 * constant lives in a 'use client' store module; importing it would pull
 * in useSyncExternalStore/React machinery for a plain string.
 */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Resolves a known display name to its UserRole — used to route a DM
 * notification to the right recipientRole. Only recognizes names already
 * known to this mock system's identity constants (lecturerRoster,
 * CONTRIBUTOR_NAME, CURRENT_MEMBER_NAME) — there is no general user
 * directory to look up an arbitrary name against.
 *
 * Named lecturer/contributor personas (e.g. a course's instructor) can
 * still appear as message senders/participants — that's just a display
 * name — but they no longer resolve to a real UserRole since neither
 * persona has a signed-in seat after portal consolidation. Returns
 * undefined for them, same as any other unrecognized name, so callers
 * that gate on a resolved role (use-messages.ts's notification routing)
 * correctly skip rather than address a role nobody can receive.
 */
export function roleForName(name: string): UserRole | undefined {
  if (name === CURRENT_MEMBER_NAME) return 'member'
  if (name === CONTRIBUTOR_NAME) return undefined
  if (lecturerRoster.some((l) => l.name === name)) return undefined
  return undefined
}
