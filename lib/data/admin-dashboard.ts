import prisma from '@/prisma/client'
import { serializeBorrow, RESOURCE_INCLUDE } from '@/lib/data/borrowings'
import { getMediaTypes } from '@/lib/data/media-types'
import { getArticleStatsMap } from '@/lib/data/news-engagement'
import { mediaTypeName } from '@/lib/media-types-shared'

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
  // Started now so it runs in parallel with the batch below.
  const engagementPromise = getReaderEngagement()

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
    mediaTypes,
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
    getMediaTypes(),
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
      // `name` is the admin-managed display name, in the admin's sort order — widgets never map codes to labels themselves.
      byMediaType: qtyByMediaType
        .map((m) => ({ mediaType: m.mediaType, name: mediaTypeName(m.mediaType, mediaTypes), qty: m._sum.totalQty ?? 0 }))
        .sort((a, b) => {
          const ia = mediaTypes.findIndex((t) => t.code === a.mediaType)
          const ib = mediaTypes.findIndex((t) => t.code === b.mediaType)
          return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib)
        }),
      newest: newestResources,
    },
    popular,
    engagement: await engagementPromise,
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

type IdCount = { _count: { _all: number } }

/**
 * Reader engagement for the admin home: how many people viewed and commented
 * on news articles and on books, plus the five most viewed of each. Counts and
 * groupBys only (never whole collections). "Comments" on a book are its member
 * reviews. Any failed read (e.g. a dev server on an older Prisma client)
 * falls back to zero/empty so the rest of the dashboard still renders.
 */
export async function getReaderEngagement() {
  const zero = () => 0
  const [
    articleViews, articleComments, articleLikes, topArticleViews,
    bookViews, bookReviews, topBookViews,
  ] = await Promise.all([
    prisma.newsArticleView.count().catch(zero),
    prisma.newsArticleComment.count().catch(zero),
    prisma.newsArticleReaction.count({ where: { type: 'LIKE' } }).catch(zero),
    prisma.newsArticleView.groupBy({ by: ['articleId'], _count: { _all: true }, orderBy: { _count: { articleId: 'desc' } }, take: 5 })
      .catch(() => [] as ({ articleId: string } & IdCount)[]),
    prisma.resourceView.count().catch(zero),
    prisma.review.count().catch(zero),
    prisma.resourceView.groupBy({ by: ['resourceId'], _count: { _all: true }, orderBy: { _count: { resourceId: 'desc' } }, take: 5 })
      .catch(() => [] as ({ resourceId: string } & IdCount)[]),
  ])

  const articleIds = topArticleViews.map((g) => g.articleId)
  const bookIds = topBookViews.map((g) => g.resourceId)
  const [articles, articleStats, books] = await Promise.all([
    articleIds.length ? prisma.newsArticle.findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true, isEdition: true } }) : [],
    getArticleStatsMap(articleIds),
    bookIds.length ? prisma.resource.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true, reviewCount: true } }) : [],
  ])

  return {
    articles: {
      views: articleViews,
      comments: articleComments,
      likes: articleLikes,
      top: topArticleViews.flatMap((g) => {
        const a = articles.find((x) => x.id === g.articleId)
        return a ? [{ id: a.id, title: a.title, isEdition: a.isEdition, views: g._count._all, comments: articleStats.get(a.id)?.comments ?? 0, likes: articleStats.get(a.id)?.likes ?? 0 }] : []
      }),
    },
    books: {
      views: bookViews,
      reviews: bookReviews,
      top: topBookViews.flatMap((g) => {
        const b = books.find((x) => x.id === g.resourceId)
        return b ? [{ id: b.id, title: b.title, views: g._count._all, reviews: b.reviewCount }] : []
      }),
    },
  }
}
