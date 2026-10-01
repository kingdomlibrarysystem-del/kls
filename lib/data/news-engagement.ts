import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

import type { ArticleComment, ArticleEngagement } from '@/lib/news-engagement-shared'
export { COMMENT_MAX_LENGTH, type ArticleComment, type ArticleEngagement, type ReactionType } from '@/lib/news-engagement-shared'

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
 * Everything the article reader shows under the article — counts, the
 * viewer's own reaction, and visible comments — in one parallel batch.
 * Shared by the server page (initial render) and GET /api/news/articles/[id]/engagement.
 */
export async function getArticleEngagement(articleId: string, viewerId?: string): Promise<ArticleEngagement> {
  if (!isObjectId(articleId)) return { likes: 0, dislikes: 0, myReaction: null, comments: [] }
  const [counts, mine, comments] = await Promise.all([
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
  return { ...counts, myReaction: mine?.type ?? null, comments: comments.map(serializeComment) }
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
  likes: number
  dislikes: number
  comments: number
  hiddenComments: number
}

/**
 * Per-article likes/dislikes/comments for the admin engagement table —
 * three groupBy queries instead of counting per article (no N+1).
 * Only articles with at least one reaction or comment are listed.
 */
export async function getArticleEngagementStats(): Promise<ArticleEngagementStat[]> {
  const [reactionGroups, commentGroups] = await Promise.all([
    prisma.newsArticleReaction.groupBy({ by: ['articleId', 'type'], _count: { _all: true } }),
    prisma.newsArticleComment.groupBy({ by: ['articleId', 'status'], _count: { _all: true } }),
  ])
  const ids = [...new Set([...reactionGroups.map((g) => g.articleId), ...commentGroups.map((g) => g.articleId)])]
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
        likes: r('LIKE'),
        dislikes: r('DISLIKE'),
        comments: c('VISIBLE') + c('HIDDEN'),
        hiddenComments: c('HIDDEN'),
      }
    })
    .sort((x, y) => y.likes + y.dislikes + y.comments - (x.likes + x.dislikes + x.comments))
}

/** True when `articleId` is a valid id of a PUBLISHED article — the only articles readers may react to or comment on. */
export async function isPublishedArticle(articleId: string): Promise<boolean> {
  if (!isObjectId(articleId)) return false
  const article = await prisma.newsArticle.findUnique({ where: { id: articleId }, select: { status: true } })
  return article?.status === 'PUBLISHED'
}
