import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { checkRateLimit } from '@/lib/rate-limit'
import { isObjectId } from '@/lib/server/object-id'
import { getReactionCounts, isPublishedArticle } from '@/lib/data/news-engagement'

const reactionSchema = z.object({
  articleId: z.string().min(1, 'articleId is required'),
  /** null removes the caller's reaction. */
  type: z.enum(['LIKE', 'DISLIKE']).nullable(),
})

/**
 * PUT /api/news/reactions  { articleId, type: 'LIKE' | 'DISLIKE' | null }
 * Signed-in readers only. Sets, switches or clears the caller's single
 * reaction on a PUBLISHED article (unique articleId+userId), then returns
 * the fresh counts and the caller's reaction.
 */
export const PUT = withErrorHandling('/api/news/reactions', 'PUT', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  checkRateLimit(request, 'news-reaction', { max: 60, windowMs: 60_000 })

  const parsed = reactionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { articleId, type } = parsed.data
  if (!(await isPublishedArticle(articleId))) throw new ApiError('Article not found', 404)

  const { userId } = auth.session
  if (type === null) {
    await prisma.newsArticleReaction.deleteMany({ where: { articleId, userId } })
  } else {
    await prisma.newsArticleReaction.upsert({
      where: { articleId_userId: { articleId, userId } },
      create: { articleId, userId, type },
      update: { type },
    })
  }

  const counts = await getReactionCounts(articleId)
  return NextResponse.json({ data: { ...counts, myReaction: type }, message: 'Reaction saved', code: 'success', status: 200 })
})

/**
 * DELETE /api/news/reactions?articleId=…  — staff only.
 * Resets (removes) every like/dislike on one article (admin engagement page).
 */
export const DELETE = withErrorHandling('/api/news/reactions', 'DELETE', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const articleId = new URL(request.url).searchParams.get('articleId') ?? ''
  if (!isObjectId(articleId)) throw new ApiError('Article not found', 404)
  const { count } = await prisma.newsArticleReaction.deleteMany({ where: { articleId } })
  return NextResponse.json({ data: { removed: count }, message: `Removed ${count} reaction(s)`, code: 'success', status: 200 })
})
