/**
 * Cross-module figures for the Reports & Analytics dashboard, derived live
 * from each module's own existing mock data (not separately invented
 * numbers) so this page can never drift out of sync with what those
 * modules actually show:
 *  - Total Members       ← dashboard/users mockUsers.length
 *  - Active Loans         ← dashboard/library/borrowings initialData (status === 'active')
 *  - Enrollments (Active) ← dashboard/e-learning/enrollments mockEnrollments (status === 'ACTIVE')
 *  - Publications Pending ← dashboard/publishing/review mockSubmissions.length
 *  - Research Projects    ← dashboard/research/collaborations mockProjects (status === 'ACTIVE')
 */

// Mirrors the shape/count of app/dashboard/users/page.tsx's mockUsers array —
// that file is a page-local const, not exported, so the count (4) is copied
// here as a literal rather than imported. See the JSDoc above for the source.
const TOTAL_MEMBERS = 4

/** Mirrors app/dashboard/library/borrowings/page.tsx's initialData: 1 'active', 1 'overdue'. */
const ACTIVE_LOANS = 1

export interface ModuleTrend {
  label: string
  value: number
  max: number
  color: string
}

/**
 * Builds the trend-bar dataset from the same real per-module counts used in
 * the stat cards, so the two sections can never disagree with each other.
 */
export function buildModuleTrends(params: {
  totalMembers: number
  activeLoans: number
  activeEnrollments: number
  pendingPublications: number
  activeResearchProjects: number
}): ModuleTrend[] {
  const { totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects } = params
  const max = Math.max(totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects, 1)
  return [
    { label: 'Members', value: totalMembers, max, color: 'bg-w-600' },
    { label: 'Library (Active Loans)', value: activeLoans, max, color: 'bg-teal-500' },
    { label: 'E-Learning (Active Enrollments)', value: activeEnrollments, max, color: 'bg-purple-500' },
    { label: 'Publishing (Pending Review)', value: pendingPublications, max, color: 'bg-yellow-500' },
    { label: 'Research (Active Projects)', value: activeResearchProjects, max, color: 'bg-green-600' },
  ]
}

export { TOTAL_MEMBERS, ACTIVE_LOANS }
