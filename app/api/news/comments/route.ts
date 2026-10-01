import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { checkRateLimit } from '@/lib/rate-limit'
import { COMMENT_MAX_LENGTH, getAdminComments, isPublishedArticle, serializeComment } from '@/lib/data/news-engagement'

/**
 * GET /api/news/comments — staff only.
 * Newest comments across all articles (any status) for moderation. The admin
 * page renders this server-side; this endpoint serves refreshes.
 */
export const GET = withErrorHandling('/api/news/comments', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const data = await getAdminComments()
  return NextResponse.json({ data, message: 'Comments fetched successfully', code: 'success', status: 200 })
})

const createCommentSchema = z.object({
  articleId: z.string().min(1, 'articleId is required'),
  body: z.string().trim().min(1, 'Write something before posting').max(COMMENT_MAX_LENGTH, `Comments are limited to ${COMMENT_MAX_LENGTH} characters`),
})

/**
 * POST /api/news/comments  { articleId, body } — signed-in readers only.
 * Posts a comment on a PUBLISHED article; visible immediately, admins can
 * hide/delete it from /dashboard/news/engagement.
 */
export const POST = withErrorHandling('/api/news/comments', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  checkRateLimit(request, 'news-comment', { max: 10, windowMs: 60_000 })

  const parsed = createCommentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { articleId, body } = parsed.data
  if (!(await isPublishedArticle(articleId))) throw new ApiError('Article not found', 404)

  const { userId } = auth.session
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, firstName: true, lastName: true } })
  const authorName = user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Member'

  const comment = await prisma.newsArticleComment.create({ data: { articleId, userId, authorName, body } })
  return NextResponse.json({ data: serializeComment(comment), message: 'Comment posted', code: 'success', status: 201 }, { status: 201 })
})
