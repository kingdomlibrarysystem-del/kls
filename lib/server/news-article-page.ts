import { cache } from 'react'
import { getNewsArticleDetail, getNewsCategoryColor, getMoreArticles, type MoreArticleItem } from '@/lib/data/news-articles'
import { getArticleEngagement, type ArticleEngagement } from '@/lib/data/news-engagement'
import { getPageSession, isStaffRole } from '@/lib/server/page-session'
import { toPlain } from '@/lib/server/to-plain'
import type { NewsArticle } from '@/app/dashboard/news/_shared/news-data'

/**
 * Loads an article for the member/public reader pages with the same
 * visibility rule as GET /api/news/articles/[id]: published articles are
 * public, anything else is staff-only. Returns article: null when missing
 * or not visible. cache()d so generateMetadata + the page share one query.
 * For PUBLISHED articles it also loads likes/dislikes, the viewer's own
 * reaction and visible comments (engagement: null otherwise), plus the
 * latest other published articles for the "More articles" rail.
 */
export const loadReadableArticle = cache(async (id: string) => {
  const detail = await getNewsArticleDetail(id)
  const empty = { article: null, categoryColor: null, engagement: null, moreArticles: [] as MoreArticleItem[] }
  if (!detail) return empty
  if (!detail.published) {
    const session = await getPageSession()
    if (!session || !isStaffRole(session.role)) return empty
  }
  const session = detail.published ? await getPageSession() : null
  const [categoryColor, moreArticles, engagement] = await Promise.all([
    getNewsCategoryColor(detail.article.category),
    // "More articles" rail — secondary, so a failure just leaves it empty.
    getMoreArticles(id).catch(() => [] as MoreArticleItem[]),
    // Comments/reactions are secondary: if they fail to load, the article
    // still renders (just without the engagement section) instead of erroring.
    detail.published
      ? getArticleEngagement(id, session?.userId).catch((err) => {
          console.error('[news] could not load article engagement:', err)
          return null
        })
      : Promise.resolve(null),
  ])
  return { article: toPlain<NewsArticle>(detail.article), categoryColor, engagement: engagement as ArticleEngagement | null, moreArticles }
})
