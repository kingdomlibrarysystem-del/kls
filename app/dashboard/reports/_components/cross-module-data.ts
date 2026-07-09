import { initialUsers } from '@/app/dashboard/users/_components/users-data'
import { initialData as initialBorrowings } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

/**
 * Cross-module figures for the Reports & Analytics dashboard, derived live
 * from each module's own existing mock data (not separately invented
 * numbers) so this page can never drift out of sync with what those
 * modules actually show:
 *  - Total Members       ← dashboard/users initialUsers.length
 *  - Active Loans         ← dashboard/library/borrowings initialData (status === 'active')
 *  - Enrollments (Active) ← dashboard/e-learning/enrollments mockEnrollments (status === 'ACTIVE')
 *  - Publications Pending ← dashboard/publishing/review mockSubmissions.length
 *  - Research Projects    ← dashboard/research/collaborations mockProjects (status === 'ACTIVE')
 *
 * Previously TOTAL_MEMBERS/ACTIVE_LOANS were hardcoded literals mirroring a
 * page-local, unexported array — the users module has since been renamed
 * (mockUsers → initialUsers) and its row count grew from 4 to 14, and
 * borrowings grew from a smaller seed to 12 rows with 3 active statuses,
 * silently desyncing both the literal and its own comment. Both modules'
 * arrays are exported today, so there's no reason to hand-copy a count.
 */
const TOTAL_MEMBERS = initialUsers.length

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

export { TOTAL_MEMBERS, ACTIVE_LOANS }
