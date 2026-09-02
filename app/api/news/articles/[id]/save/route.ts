import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Thin alias fulfilling the in-page hint's literal POST
 * /api/news/articles/:id/save URL — internally does the same
 * Favorite upsert /api/favorites' own POST does (itemType: 'ARTICLE'),
 * re-implemented inline per this codebase's "no shared handler across
 * route files" convention rather than importing across route modules.
 */
const saveArticleSchema = z.object({ userId: z.string().min(1, 'userId is required') })

export const POST = withErrorHandling('/api/news/articles/[id]/save', 'POST', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = saveArticleSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { userId } = parsed.data

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const article = await prisma.newsArticle.findUnique({ where: { id } })
  if (!article) throw new ApiError('Article not found', 404)

  const favorite = await prisma.favorite.upsert({
    where: { userId_itemId: { userId, itemId: id } },
    update: {},
    create: { userId, itemId: id, itemType: 'ARTICLE', title: article.title, subtitle: article.summary },
  })

  return NextResponse.json({ data: { id: favorite.itemId, type: favorite.itemType }, message: 'Article saved successfully', code: 'success', status: 201 }, { status: 201 })
})
