/**
 * Cross-module figures for the Reports & Analytics dashboard. All five
 * numbers (totalMembers/activeLoans/activeEnrollments/
 * pendingPublications/activeResearchProjects) are real live aggregate
 * queries from /api/reports/cross-module (see use-cross-module-report.ts)
 * over the real User/Borrow/Enrollment/Publication/ResearchProject
 * collections — this file now only holds the trend-bar shaping logic,
 * kept separate from the data-fetching hook so the two sections
 * (stat cards, trend bars) can never disagree with each other.
 */
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
