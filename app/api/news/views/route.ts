import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { isPublishedArticle } from '@/lib/data/news-engagement'

const viewSchema = z.object({
  articleId: z.string().min(1, 'articleId is required'),
  /** Random id kept in the browser for signed-out visitors, so each browser counts once. Ignored when signed in. */
  anonymousId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
})

/**
 * POST /api/news/views  { articleId, anonymousId? } — public.
 * Records that a reader opened a PUBLISHED news article (the article pages
 * call this on load). No login needed. One row per viewer per article
 * (signed-in user id, or the browser's anonymous id), so reloading does not
 * inflate the count. Same rules as POST /api/resource-views for books.
 * Returns the article's unique-viewer total.
 */
export const POST = withErrorHandling('/api/news/views', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'news-view', { max: 60, windowMs: 60_000 })

  const parsed = viewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { articleId, anonymousId } = parsed.data
  if (!(await isPublishedArticle(articleId))) throw new ApiError('Article not found', 404)

  const session = await getServerSession(authOptions)
  const viewerKey = session?.user?.id ? `u:${session.user.id}` : anonymousId ? `a:${anonymousId}` : null
  if (!viewerKey) throw new ApiError('anonymousId is required when signed out', 400)

  const key = { articleId_viewerKey: { articleId, viewerKey } }
  const already = await prisma.newsArticleView.findUnique({ where: key, select: { id: true } })
  if (!already) {
    await prisma.newsArticleView.upsert({ where: key, create: { articleId, viewerKey }, update: {} })
    // A new viewer changes the counts on the landing page's news strip: expire its data cache now.
    try { revalidateTag('home-page', { expire: 0 }) } catch { /* outside a Next request (tests) */ }
  }
  const views = await prisma.newsArticleView.count({ where: { articleId } })
  return NextResponse.json({ data: { articleId, views }, message: 'View recorded', code: 'success', status: 200 })
})
