import { initialData as initialBorrowings } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

/**
 * Cross-module figures for the Reports & Analytics dashboard, derived live
 * from each module's own existing mock data (not separately invented
 * numbers) so this page can never drift out of sync with what those
 * modules actually show:
 *  - Total Members       ← dashboard/users useUsers().length (live store — see reports-view.tsx)
 *  - Active Loans         ← dashboard/library/borrowings initialData (status === 'active')
 *  - Enrollments (Active) ← dashboard/e-learning/enrollments mockEnrollments (status === 'ACTIVE')
 *  - Publications Pending ← dashboard/publishing/review useReviewQueue().length (live store, not the static mockSubmissions seed)
 *  - Research Projects    ← dashboard/research/collaborations mockProjects (status === 'ACTIVE')
 *
 * Total Members used to read `initialUsers.length`, a snapshot constant
 * that couldn't reflect Add User/Delete User within a session without a
 * full reload — now computed in reports-view.tsx from the same `useUsers()`
 * store `/dashboard/users` itself reads. Active Loans still reads the
 * static borrowings seed — there's no live borrowings store yet, unlike
 * users, so this one constant remains a snapshot for now.
 */
const ACTIVE_LOANS = initialBorrowings.filter((b) => b.status === 'active').length

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

export { ACTIVE_LOANS }
