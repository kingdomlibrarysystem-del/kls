import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { serializeComment } from '@/lib/data/news-engagement'

const statusSchema = z.object({ status: z.enum(['VISIBLE', 'HIDDEN']) })

/** Staff: hide or re-show a comment (moderation). */
export const PATCH = withErrorHandling('/api/news/comments/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Comment not found', 404)
  const parsed = statusSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.newsArticleComment.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new ApiError('Comment not found', 404)
  const comment = await prisma.newsArticleComment.update({ where: { id }, data: { status: parsed.data.status } })
  return NextResponse.json({ data: serializeComment(comment), message: parsed.data.status === 'HIDDEN' ? 'Comment hidden' : 'Comment restored', code: 'success', status: 200 })
})

/** The comment's author deletes their own comment, or staff delete any comment. */
export const DELETE = withErrorHandling('/api/news/comments/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Comment not found', 404)
  const comment = await prisma.newsArticleComment.findUnique({ where: { id }, select: { userId: true } })
  if (!comment) throw new ApiError('Comment not found', 404)

  const { userId, role } = auth.session
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'
  if (comment.userId !== userId && !isStaff) throw new ApiError('You can only delete your own comments.', 403)

  await prisma.newsArticleComment.delete({ where: { id } })
  return NextResponse.json({ data: { id }, message: 'Comment deleted', code: 'success', status: 200 })
})
