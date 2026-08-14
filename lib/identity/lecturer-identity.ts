/**
 * The signed-in lecturer this mocked portal represents — same pattern as
 * CONTRIBUTOR_NAME (lib/identity/contributor-identity.ts): used to filter
 * shared stores (course catalog, session requests, messages) down to
 * "this lecturer's own" records, since there's no real auth/session
 * concept wired up yet. Reuses "Dr. Elias Nkubito", already the instructor
 * name shown on every course card before this feature existed, for
 * continuity rather than introducing an unrelated new name. Relocated
 * here (from app/lecturer/_components/) during portal consolidation
 * Phase 3 — this file is genuinely shared cross-portal infrastructure
 * (imported by admin's course catalog, member's session/messaging flows,
 * and lib/messaging/**) that happened to live inside the lecturer portal
 * folder; the LECTURER_NAME/lecturerRoster DATA CONCEPTS survive the
 * portal's removal (see portal-consolidation-audit.md §4).
 */
export const LECTURER_NAME = 'Dr. Elias Nkubito'

/**
 * Small roster of named lecturer personas so "my course's lecturer" is a
 * real, distinct relationship rather than every course routing to one
 * person — see CatalogCourse.lecturerId, which assigns each course to one
 * of these 3 lecturers. `id` is now the real seeded User.id for each
 * lecturer (see prisma/seed/seed-phase5.mjs's lecturerIdToUserId mapping)
 * rather than a fake 'lec-1' placeholder — this is what makes messaging
 * and session-booking's real Channel/Message/SessionRequest APIs able to
 * resolve a course's lecturer to a real participantId/lecturerId.
 */
export interface LecturerProfile {
  id: string
  name: string
}

export const lecturerRoster: LecturerProfile[] = [
  { id: '6a6cc03c0dd150d62b116a14', name: 'Dr. Elias Nkubito' },
  { id: '6a6cc03c0dd150d62b116a15', name: 'Prof. Grace Nkomo' },
  { id: '6a6cc03c0dd150d62b116a16', name: 'Dr. James Kariuki' },
]
