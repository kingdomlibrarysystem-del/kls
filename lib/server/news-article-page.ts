import { cache } from 'react'
import { getNewsArticleDetail, getNewsCategoryColor } from '@/lib/data/news-articles'
import { getPageSession, isStaffRole } from '@/lib/server/page-session'
import { toPlain } from '@/lib/server/to-plain'
import type { NewsArticle } from '@/app/dashboard/news/_shared/news-data'

/**
 * Loads an article for the member/public reader pages with the same
 * visibility rule as GET /api/news/articles/[id]: published articles are
 * public, anything else is staff-only. Returns article: null when missing
 * or not visible. cache()d so generateMetadata + the page share one query.
 */
export const loadReadableArticle = cache(async (id: string) => {
  const detail = await getNewsArticleDetail(id)
  if (!detail) return { article: null, categoryColor: null }
  if (!detail.published) {
    const session = await getPageSession()
    if (!session || !isStaffRole(session.role)) return { article: null, categoryColor: null }
  }
  const categoryColor = await getNewsCategoryColor(detail.article.category)
  return { article: toPlain<NewsArticle>(detail.article), categoryColor }
})
