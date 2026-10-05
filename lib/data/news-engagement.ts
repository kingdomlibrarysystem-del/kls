import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

import { EMPTY_ARTICLE_STATS, type ArticleComment, type ArticleEngagement, type ArticleStats } from '@/lib/news-engagement-shared'
export { COMMENT_MAX_LENGTH, EMPTY_ARTICLE_STATS, type ArticleComment, type ArticleEngagement, type ArticleStats, type ReactionType } from '@/lib/news-engagement-shared'

export function serializeComment(c: { id: string; userId: string; authorName: string; body: string; status: string; createdAt: Date }): ArticleComment {
  return {
    id: c.id,
    userId: c.userId,
    authorName: c.authorName,
    body: c.body,
    status: c.status as ArticleComment['status'],
    createdAt: c.createdAt.toISOString(),
  }
}

/** Like/dislike counts for one article (two indexed counts in parallel). */
export async function getReactionCounts(articleId: string) {
  const [likes, dislikes] = await Promise.all([
    prisma.newsArticleReaction.count({ where: { articleId, type: 'LIKE' } }),
    prisma.newsArticleReaction.count({ where: { articleId, type: 'DISLIKE' } }),
  ])
  return { likes, dislikes }
}

/**
 * Views / likes / visible comments for a LIST of articles in three groupBy
 * queries (never one count per article). Every list that shows article cards
 * — landing page, /news, /member/news, "more articles", admin tables — uses
 * this, so the numbers always agree. A failed read (e.g. a dev server still
 * on an older Prisma client) yields zeros instead of breaking the list.
 */
export async function getArticleStatsMap(articleIds: string[]): Promise<Map<string, ArticleStats>> {
  const ids = [...new Set(articleIds.filter(isObjectId))]
  const map = new Map<string, ArticleStats>(ids.map((id) => [id, { ...EMPTY_ARTICLE_STATS }]))
  if (ids.length === 0) return map
  type Group = { articleId: string; _count: { _all: number } }
  const none = (): Group[] => []
  const [views, likes, comments] = await Promise.all([
    prisma.newsArticleView.groupBy({ by: ['articleId'], where: { articleId: { in: ids } }, _count: { _all: true } }).catch(none),
    prisma.newsArticleReaction.groupBy({ by: ['articleId'], where: { articleId: { in: ids }, type: 'LIKE' }, _count: { _all: true } }).catch(none),
    prisma.newsArticleComment.groupBy({ by: ['articleId'], where: { articleId: { in: ids }, status: 'VISIBLE' }, _count: { _all: true } }).catch(none),
  ])
  for (const g of views) map.get(g.articleId)!.views = g._count._all
  for (const g of likes) map.get(g.articleId)!.likes = g._count._all
  for (const g of comments) map.get(g.articleId)!.comments = g._count._all
  return map
}

/** Adds `stats` to each row of an article list (one batch of three groupBys for the whole list). */
export async function withArticleStats<T extends { id: string }>(rows: T[]): Promise<(T & { stats: ArticleStats })[]> {
  const stats = await getArticleStatsMap(rows.map((r) => r.id))
  return rows.map((r) => ({ ...r, stats: stats.get(r.id) ?? { ...EMPTY_ARTICLE_STATS } }))
}

/**
 * Everything the article reader shows under the article — counts, the
 * viewer's own reaction, and visible comments — in one parallel batch.
 * Shared by the server page (initial render) and GET /api/news/articles/[id]/engagement.
 */
export async function getArticleEngagement(articleId: string, viewerId?: string): Promise<ArticleEngagement> {
  if (!isObjectId(articleId)) return { views: 0, likes: 0, dislikes: 0, myReaction: null, comments: [] }
  const [views, counts, mine, comments] = await Promise.all([
    prisma.newsArticleView.count({ where: { articleId } }).catch(() => 0),
    getReactionCounts(articleId),
    viewerId
      ? prisma.newsArticleReaction.findUnique({ where: { articleId_userId: { articleId, userId: viewerId } }, select: { type: true } })
      : Promise.resolve(null),
    prisma.newsArticleComment.findMany({
      where: { articleId, status: 'VISIBLE' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, userId: true, authorName: true, body: true, status: true, createdAt: true },
    }),
  ])
  return { views, ...counts, myReaction: mine?.type ?? null, comments: comments.map(serializeComment) }
}

/** Admin moderation row: a comment plus the title of the article it is on. */
export interface AdminComment extends ArticleComment {
  articleId: string
  articleTitle: string
}

/** Newest comments across all articles (any status) for the admin moderation table. */
export async function getAdminComments(limit = 500): Promise<AdminComment[]> {
  const rows = await prisma.newsArticleComment.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, userId: true, authorName: true, body: true, status: true, createdAt: true, articleId: true, article: { select: { title: true } } },
  })
  return rows.map((r) => ({ ...serializeComment(r), articleId: r.articleId, articleTitle: r.article.title }))
}

export interface ArticleEngagementStat {
  articleId: string
  title: string
  status: string
  views: number
  likes: number
  dislikes: number
  comments: number
  hiddenComments: number
}

/**
 * Per-article views/likes/dislikes/comments for the admin engagement table —
 * three groupBy queries instead of counting per article (no N+1).
 * Only articles with at least one view, reaction or comment are listed.
 */
export async function getArticleEngagementStats(): Promise<ArticleEngagementStat[]> {
  const [reactionGroups, commentGroups, viewGroups] = await Promise.all([
    prisma.newsArticleReaction.groupBy({ by: ['articleId', 'type'], _count: { _all: true } }),
    prisma.newsArticleComment.groupBy({ by: ['articleId', 'status'], _count: { _all: true } }),
    prisma.newsArticleView.groupBy({ by: ['articleId'], _count: { _all: true } }).catch(() => [] as { articleId: string; _count: { _all: number } }[]),
  ])
  const viewsByArticle = new Map(viewGroups.map((g) => [g.articleId, g._count._all]))
  const ids = [...new Set([...reactionGroups.map((g) => g.articleId), ...commentGroups.map((g) => g.articleId), ...viewGroups.map((g) => g.articleId)])]
  if (ids.length === 0) return []
  const articles = await prisma.newsArticle.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, status: true } })

  return articles
    .map((a) => {
      const r = (type: string) => reactionGroups.find((g) => g.articleId === a.id && g.type === type)?._count._all ?? 0
      const c = (status: string) => commentGroups.find((g) => g.articleId === a.id && g.status === status)?._count._all ?? 0
      return {
        articleId: a.id,
        title: a.title,
        status: a.status,
        views: viewsByArticle.get(a.id) ?? 0,
        likes: r('LIKE'),
        dislikes: r('DISLIKE'),
        comments: c('VISIBLE') + c('HIDDEN'),
        hiddenComments: c('HIDDEN'),
      }
    })
    .sort((x, y) => y.views + y.likes + y.dislikes + y.comments - (x.views + x.likes + x.dislikes + x.comments))
}

/** True when `articleId` is a valid id of a PUBLISHED article — the only articles readers may react to or comment on. */
export async function isPublishedArticle(articleId: string): Promise<boolean> {
  if (!isObjectId(articleId)) return false
  const article = await prisma.newsArticle.findUnique({ where: { id: articleId }, select: { status: true } })
  return article?.status === 'PUBLISHED'
}
