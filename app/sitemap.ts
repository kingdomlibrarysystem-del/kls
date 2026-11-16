import type { MetadataRoute } from 'next'
import prisma from '@/prisma/client'
import { getServicesNav } from '@/lib/services/data'
import { MAIN_PAGES, SITE_URL } from '@/lib/site'

// Rebuilt at most once an hour, so new courses, books and articles get listed without a redeploy.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]
const url = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

/** Every public page Google may list. Signed-in areas are left out (and blocked in robots.ts). */
export default async function sitemap(): Promise<Entry[]> {
  const now = new Date()
  // A part that fails to load is left out instead of breaking the whole sitemap.
  const safe = <T,>(p: Promise<T>, fallback: T) => p.catch((err) => { console.error('[sitemap] part failed to load:', err); return fallback })

  const [services, courses, articles, books] = await Promise.all([
    safe(getServicesNav(), []),
    safe(prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, updatedAt: true }, take: 1000 }), []),
    safe(prisma.newsArticle.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, updatedAt: true }, orderBy: { createdAt: 'desc' }, take: 1000 }), []),
    safe(prisma.resource.findMany({ where: { status: { notIn: ['ARCHIVED', 'DRAFT'] } }, select: { id: true }, orderBy: { createdAt: 'desc' }, take: 3000 }), []),
  ])

  return [
    { url: url('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    ...MAIN_PAGES.map((p): Entry => ({
      url: url(p.path),
      lastModified: now,
      changeFrequency: p.path.startsWith('/auth') ? 'yearly' : 'daily',
      priority: p.path.startsWith('/auth') ? 0.6 : 0.9,
    })),
    { url: url('/shop'), lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: url('/publish'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/life-sciences'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    ...services.map((s): Entry => ({ url: url(`/services/${s.slug}`), lastModified: now, changeFrequency: 'weekly', priority: 0.8 })),
    ...courses.map((c): Entry => ({ url: url(`/courses/${c.id}`), lastModified: c.updatedAt, changeFrequency: 'weekly', priority: 0.7 })),
    ...articles.map((a): Entry => ({ url: url(`/news/${a.id}`), lastModified: a.updatedAt, changeFrequency: 'monthly', priority: 0.6 })),
    ...books.map((b): Entry => ({ url: url(`/library/${b.id}`), changeFrequency: 'monthly', priority: 0.5 })),
  ]
}
