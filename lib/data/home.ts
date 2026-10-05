import prisma from '@/prisma/client'
import { withArticleStats } from '@/lib/data/news-engagement'
import type { ArticleStats } from '@/lib/news-engagement-shared'

/** How many books the landing page's trending grid shows (2 rows × 5 on large screens). */
export const TRENDING_BOOKS_LIMIT = 10

export interface TrendingBook {
  id: string
  title: string
  cover: string | null
  /** Unique viewers (ResourceView rows). */
  views: number
}

export interface HomeNewsItem {
  id: string
  title: string
  summary: string
  category: string
  coverImage: string | null
  isEdition: boolean
  publishedAt: string | null
  /** Views / likes / visible comments shown on the news strip. */
  stats: ArticleStats
}

export interface HomeCourse {
  id: string
  title: string
  category: string
  instructor: string
  lessons: number
  students: number
  /** Course cover, when one was uploaded — used as a thumbnail in the hero's E-Learning card. */
  image: string | null
}

export interface HomePaper {
  id: string
  title: string
  project: string
  keywords: string[]
  author: string
  publishedAt: string
}

/**
 * Trending = most viewed first; when fewer than `limit` books have views, the
 * rest is filled with the newest non-archived resources. Two small queries
 * (a groupBy + one findMany) instead of downloading the whole catalog.
 */
export async function getTrendingBooks(limit = TRENDING_BOOKS_LIMIT): Promise<TrendingBook[]> {
  // The views table is new — if it can't be read (e.g. a dev server still
  // running an older Prisma client) fall back to "newest books, 0 views".
  const viewGroups = await prisma.resourceView
    .groupBy({ by: ['resourceId'], _count: { _all: true }, orderBy: { _count: { resourceId: 'desc' } }, take: limit * 2 })
    .catch(() => [] as { resourceId: string; _count: { _all: number } }[])
  const viewsById = new Map(viewGroups.map((g) => [g.resourceId, g._count._all]))

  const select = { id: true, title: true, coverImages: true } as const
  const [viewed, newest] = await Promise.all([
    viewsById.size
      ? prisma.resource.findMany({ where: { id: { in: [...viewsById.keys()] }, status: { not: 'ARCHIVED' } }, select })
      : Promise.resolve([]),
    prisma.resource.findMany({ where: { status: { not: 'ARCHIVED' } }, orderBy: { createdAt: 'desc' }, take: limit, select }),
  ])

  const ranked = [...viewed].sort((a, b) => (viewsById.get(b.id) ?? 0) - (viewsById.get(a.id) ?? 0))
  const seen = new Set(ranked.map((r) => r.id))
  const merged = [...ranked, ...newest.filter((r) => !seen.has(r.id))].slice(0, limit)
  return merged.map((r) => ({ id: r.id, title: r.title, cover: r.coverImages[0] ?? null, views: viewsById.get(r.id) ?? 0 }))
}

/**
 * Everything the public landing page shows, loaded on the server in one
 * parallel batch (PERFORMANCE.md Rule 15). Replaces four browser fetches:
 * /api/resources?pageSize=1000, /api/courses?pageSize=1000,
 * /api/news/articles?pageSize=5 and /api/research-papers?pageSize=1000 (the
 * last one is staff-only, so signed-out visitors got a 401 and no research).
 * Each part is independent: a failure leaves that section empty/hidden
 * instead of breaking the page.
 */
export async function getHomePageData() {
  const safe = <T,>(p: Promise<T>, fallback: T) => p.catch((err) => { console.error('[home] section failed to load:', err); return fallback })

  const [trendingBooks, newsRows, courseRows, courseCount, lessonCount, enrollmentCount, paperRows] = await Promise.all([
    safe(getTrendingBooks(), [] as TrendingBook[]),
    safe(prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      // No `content` — the strip only shows the teaser.
      select: { id: true, title: true, summary: true, category: true, coverImage: true, isEdition: true, publishedAt: true },
    }), []),
    safe(prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true, title: true, category: true, image: true,
        lecturer: { select: { name: true, firstName: true, lastName: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    }), []),
    safe(prisma.course.count({ where: { status: 'PUBLISHED' } }), 0),
    safe(prisma.lesson.count({ where: { course: { status: 'PUBLISHED' } } }), 0),
    safe(prisma.enrollment.count({ where: { course: { status: 'PUBLISHED' } } }), 0),
    safe(prisma.researchPaper.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { id: true, title: true, keywords: true, authorName: true, publishedAt: true, project: { select: { title: true } } },
    }), []),
  ])

  const news: HomeNewsItem[] = await withArticleStats(newsRows.map((n) => ({ ...n, publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null })))

  const courses: HomeCourse[] = courseRows.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    // Same rule as the courses API + useCourses: lecturer's name, else 'Unassigned'.
    instructor: (c.lecturer ? c.lecturer.name ?? `${c.lecturer.firstName ?? ''} ${c.lecturer.lastName ?? ''}`.trim() : '') || 'Unassigned',
    lessons: c._count.lessons,
    students: c._count.enrollments,
    image: c.image ?? null,
  }))

  const papers: HomePaper[] = paperRows.map((p) => ({
    id: p.id,
    title: p.title,
    project: p.project.title,
    keywords: p.keywords,
    author: p.authorName,
    publishedAt: p.publishedAt.toISOString(),
  }))

  return {
    trendingBooks,
    news,
    courses,
    courseStats: { courses: courseCount, lessons: lessonCount, enrollments: enrollmentCount },
    papers,
  }
}

export type HomePageData = Awaited<ReturnType<typeof getHomePageData>>
