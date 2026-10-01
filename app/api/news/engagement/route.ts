import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { getArticleEngagement, isPublishedArticle } from '@/lib/data/news-engagement'

/**
 * GET /api/news/engagement?articleId=… — public.
 * Like/dislike counts, the caller's own reaction (when signed in) and the
 * visible comments of one PUBLISHED article. The article page renders the
 * same data on the server; this endpoint serves client refreshes.
 */
export const GET = withErrorHandling('/api/news/engagement', 'GET', async (request: NextRequest) => {
  const articleId = new URL(request.url).searchParams.get('articleId') ?? ''
  if (!(await isPublishedArticle(articleId))) throw new ApiError('Article not found', 404)

  const session = await getServerSession(authOptions)
  const data = await getArticleEngagement(articleId, session?.user?.id)
  return NextResponse.json({ data, message: 'Engagement fetched successfully', code: 'success', status: 200 })
})
