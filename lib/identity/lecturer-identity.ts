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
 * person — see CatalogCourse.lecturerId in course-catalog-data.ts, which
 * assigns each of the 12 courses to one of these 3 lecturers.
 */
export interface LecturerProfile {
  id: string
  name: string
}

export const lecturerRoster: LecturerProfile[] = [
  { id: 'lec-1', name: 'Dr. Elias Nkubito' },
  { id: 'lec-2', name: 'Prof. Grace Nkomo' },
  { id: 'lec-3', name: 'Dr. James Kariuki' },
]
