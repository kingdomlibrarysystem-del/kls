import prisma from '@/prisma/client'
import { serializeBorrow, RESOURCE_INCLUDE } from '@/lib/data/borrowings'

/**
 * Everything the admin home (/dashboard) shows, in ONE server round trip of
 * parallel aggregate queries (PERFORMANCE.md rules 1–3). Previously each
 * widget mounted its own list hook and downloaded whole collections
 * (/api/resources, /api/borrowings, /api/users, /api/reservations,
 * /api/publications, /api/research-projects — pageSize=1000 each) only to
 * count, sum or take the first few rows in the browser. Counts here are also
 * exact past 1000 rows, which the old list-based numbers silently weren't.
 */
export async function getAdminDashboardData() {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const [
    borrowByStatus,
    dueToday,
    recentBorrows,
    reservationsTotal,
    membersTotal,
    qtyTotal,
    qtyByMediaType,
    newestResources,
    topBorrowed,
    publicationsByStatus,
    projectsByStatus,
  ] = await Promise.all([
    prisma.borrow.groupBy({ by: ['status'], _count: { _all: true } }),
    // Same rule as before: ACTIVE and due on today's (UTC) date.
    prisma.borrow.count({ where: { status: 'ACTIVE', dueDate: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.borrow.findMany({ orderBy: { borrowDate: 'desc' }, take: 6, include: RESOURCE_INCLUDE }),
    prisma.reservation.count(),
    prisma.user.count(),
    prisma.resource.aggregate({ _sum: { totalQty: true } }),
    prisma.resource.groupBy({ by: ['mediaType'], _sum: { totalQty: true } }),
    prisma.resource.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, type: true } }),
    prisma.borrow.groupBy({ by: ['resourceId'], _count: { _all: true }, orderBy: { _count: { resourceId: 'desc' } }, take: 5 }),
    prisma.publication.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.researchProject.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const borrowCount = (status: string) => borrowByStatus.find((b) => b.status === status)?._count._all ?? 0
  const pubCount = (status: string) => publicationsByStatus.find((p) => p.status === status)?._count._all ?? 0

  const popularResources = topBorrowed.length
    ? await prisma.resource.findMany({ where: { id: { in: topBorrowed.map((t) => t.resourceId) } }, select: { id: true, title: true, type: true } })
    : []
  const popular = topBorrowed
    .map((t) => ({ resource: popularResources.find((r) => r.id === t.resourceId), count: t._count._all }))
    .filter((p): p is { resource: { id: string; title: string; type: string }; count: number } => !!p.resource && p.count > 0)

  return {
    borrow: {
      active: borrowCount('ACTIVE'),
      overdue: borrowCount('OVERDUE'),
      dueToday,
      total: borrowByStatus.reduce((sum, b) => sum + b._count._all, 0),
      recent: recentBorrows.map(serializeBorrow),
    },
    reservationsTotal,
    membersTotal,
    inventory: {
      totalItems: qtyTotal._sum.totalQty ?? 0,
      byMediaType: qtyByMediaType.map((m) => ({ mediaType: m.mediaType as string, qty: m._sum.totalQty ?? 0 })),
      newest: newestResources,
    },
    popular,
    publications: {
      total: publicationsByStatus.reduce((sum, p) => sum + p._count._all, 0),
      inProgress: pubCount('SUBMITTED') + pubCount('UNDER_REVIEW'),
      published: pubCount('PUBLISHED'),
    },
    projects: {
      total: projectsByStatus.reduce((sum, p) => sum + p._count._all, 0),
      active: projectsByStatus.find((p) => p.status === 'ACTIVE')?._count._all ?? 0,
    },
  }
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>
