import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Real cross-module Reports & Analytics API. Every figure is a live
 * aggregate query over a real collection — the original 5 (Users/
 * Borrow/Enrollment/Publication/ResearchProject) plus one count per
 * module added later (Beauty/Counseling/Rehabilitation/Donations/
 * News), each scoped to that module's own "active/pending" status
 * filter rather than an unfiltered total, matching activeLoans'
 * existing precedent — the one exception being totalMembers, where
 * the raw count is itself the meaningful number.
 */
export async function GET() {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const [
    totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects,
    upcomingBeautyAppointments, activeCounselingSessions, activeRehabIntakes, totalDonationsThisMonth, publishedNewsArticles,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.borrow.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { status: 'ENROLLED' } }),
    prisma.publication.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.researchProject.count({ where: { status: 'ACTIVE' } }),
    prisma.beautyAppointment.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.counselingSession.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.rehabIntake.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.donation.count({ where: { status: 'PAID', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.newsArticle.count({ where: { status: 'PUBLISHED' } }),
  ])

  return NextResponse.json({
    data: {
      totalMembers, activeLoans, activeEnrollments, pendingPublications, activeResearchProjects,
      upcomingBeautyAppointments, activeCounselingSessions, activeRehabIntakes, totalDonationsThisMonth, publishedNewsArticles,
    },
    message: 'Cross-module report fetched successfully',
    code: 'success',
    status: 200,
  })
}
