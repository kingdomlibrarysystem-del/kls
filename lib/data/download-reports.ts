import prisma from '@/prisma/client'
import type { CsvCell } from '@/lib/server/csv'

/**
 * The reports the Download Center can export as CSV
 * (GET /api/downloads/reports/[report]?from=YYYY-MM-DD&to=YYYY-MM-DD).
 * Each is built from the live database for the chosen period.
 */
export const DOWNLOAD_REPORTS = [
  { key: 'borrowing-activity', title: 'Borrowing Activity Report', description: 'Every borrow in the period: member, book, status, due and return dates, fines.' },
  { key: 'publishing-revenue', title: 'Publishing Revenue Statement', description: 'Books approved in the period: total revenue and the publisher / platform split.' },
  { key: 'learning-progress', title: 'Learning Progress Summary', description: 'Course enrollments in the period: lessons completed, progress and assessment results.' },
] as const

export type DownloadReportKey = (typeof DOWNLOAD_REPORTS)[number]['key']

export function isDownloadReportKey(key: string): key is DownloadReportKey {
  return DOWNLOAD_REPORTS.some((r) => r.key === key)
}

export interface ReportPeriod {
  /** Inclusive start (00:00 UTC). */
  from: Date
  /** Exclusive end (00:00 UTC of the day after "to"). */
  to: Date
}

/** Hard cap so one download can't pull an unbounded collection into memory. */
const MAX_ROWS = 50_000

export async function buildReport(key: DownloadReportKey, period: ReportPeriod): Promise<{ header: string[]; rows: CsvCell[][] }> {
  const range = { gte: period.from, lt: period.to }

  if (key === 'borrowing-activity') {
    const borrows = await prisma.borrow.findMany({
      // resource: { is: {} } skips borrows whose book was deleted (Prisma throws on a missing required relation).
      where: { borrowDate: range, resource: { is: {} } },
      orderBy: { borrowDate: 'asc' },
      take: MAX_ROWS,
      select: {
        borrowDate: true, dueDate: true, returnDate: true, status: true, memberName: true, memberEmail: true,
        fineAmount: true, finePaid: true, renewalCount: true, resource: { select: { title: true, isbn: true } },
      },
    })
    return {
      header: ['Borrowed on', 'Member', 'Email', 'Book', 'ISBN', 'Status', 'Due', 'Returned', 'Renewals', 'Fine (RWF)', 'Fine paid'],
      rows: borrows.map((b) => [
        b.borrowDate, b.memberName, b.memberEmail, b.resource.title, b.resource.isbn, b.status, b.dueDate, b.returnDate,
        b.renewalCount, b.fineAmount ?? 0, b.fineAmount ? (b.finePaid ? 'Yes' : 'No') : '',
      ]),
    }
  }

  if (key === 'publishing-revenue') {
    const shares = await prisma.revenueShare.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'asc' },
      take: MAX_ROWS,
      select: {
        createdAt: true, contributorShare: true, platformShare: true, totalRevenue: true,
        publication: { select: { title: true, contributorName: true, category: true, status: true } },
      },
    })
    return {
      header: ['Approved on', 'Book', 'Publisher', 'KCS category', 'Status', 'Total revenue (RWF)', 'Publisher %', 'Publisher earnings (RWF)', 'Platform %', 'Platform earnings (RWF)'],
      rows: shares.map((s) => [
        s.createdAt, s.publication.title, s.publication.contributorName, s.publication.category, s.publication.status,
        s.totalRevenue, s.contributorShare, Math.round((s.totalRevenue * s.contributorShare) / 100),
        s.platformShare, Math.round((s.totalRevenue * s.platformShare) / 100),
      ]),
    }
  }

  // learning-progress
  const enrollments = await prisma.enrollment.findMany({
    where: { enrolledAt: range },
    orderBy: { enrolledAt: 'asc' },
    take: MAX_ROWS,
    select: {
      enrolledAt: true, status: true, completedLessonIds: true, totalLessons: true, assessmentPassed: true, paid: true,
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
      course: { select: { title: true } },
    },
  })
  return {
    header: ['Enrolled on', 'Member', 'Email', 'Course', 'Status', 'Lessons completed', 'Total lessons', 'Progress %', 'Assessment passed', 'Paid'],
    rows: enrollments.map((e) => {
      const done = e.completedLessonIds.length
      const name = e.user.name || `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim()
      return [
        e.enrolledAt, name, e.user.email, e.course.title, e.status, done, e.totalLessons,
        e.totalLessons > 0 ? Math.round((done / e.totalLessons) * 100) : 0, e.assessmentPassed ? 'Yes' : 'No', e.paid ? 'Yes' : 'No',
      ]
    }),
  }
}
