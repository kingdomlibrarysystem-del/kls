import type { UserRole } from '@/contexts/auth-context'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { CONTRIBUTOR_NAME } from '@/app/contributor/_components/contributor-identity'

/**
 * This mock has a single live member persona — see use-enrollments.ts's
 * CURRENT_MEMBER_NAME. Duplicated here (not imported) because that
 * constant lives in a 'use client' store module; importing it would pull
 * in useSyncExternalStore/React machinery for a plain string.
 */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Resolves a known display name to its UserRole — used to route a DM
 * notification to the right recipientRole, since a DM's "other party" can
 * be any role (member, lecturer, contributor) rather than always the
 * fixed learner/lecturer pairing a course channel has. Only recognizes
 * names already known to this mock system's identity constants
 * (lecturerRoster, CONTRIBUTOR_NAME, CURRENT_MEMBER_NAME) — there is no
 * general user directory to look up an arbitrary name against.
 */
export function roleForName(name: string): UserRole | undefined {
  if (name === CURRENT_MEMBER_NAME) return 'member'
  if (name === CONTRIBUTOR_NAME) return 'contributor'
  if (lecturerRoster.some((l) => l.name === name)) return 'lecturer'
  return undefined
}
