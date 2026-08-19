import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Real cross-module Reports & Analytics API, replacing
 * app/dashboard/reports/_components/{cross-module-data.ts,reports-view.tsx}'s
 * mix of one real store (useUsers) and four now-superseded mocks
 * (borrowings' static initialData, e-learning's mockEnrollments,
 * publishing's OLD useReviewQueue, research's mockProjects — all four
 * have had real API-backed replacements since Phases 3/4/5/6, but this
 * page was never updated to read them). Every figure below is now a
 * live aggregate query over the real collections those phases created.
 */
export async function GET() {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const [totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects] = await Promise.all([
    prisma.user.count(),
    prisma.borrow.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { status: 'ENROLLED' } }),
    prisma.publication.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.researchProject.count({ where: { status: 'ACTIVE' } }),
  ])

  return NextResponse.json({
    data: { totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects },
    message: 'Cross-module report fetched successfully',
    code: 'success',
    status: 200,
  })
}
