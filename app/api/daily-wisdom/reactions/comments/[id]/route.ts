import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { getWisdomReactions } from '@/lib/data/daily-wisdom-reactions'

/** DELETE /api/daily-wisdom/reactions/comments/[id] — the writer, or staff (moderation), removes a comment. */
export const DELETE = withErrorHandling('/api/daily-wisdom/reactions/comments/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Comment not found', 404)
  const comment = await prisma.dailyWisdomComment.findUnique({ where: { id } })
  if (!comment) throw new ApiError('Comment not found', 404)
  if (comment.userId !== auth.session.userId && auth.session.role === 'member') throw new ApiError('You can only delete your own comment', 403)

  await prisma.dailyWisdomComment.delete({ where: { id } })
  const data = await getWisdomReactions(comment.verseId, comment.dateKey, auth.session.userId)
  return NextResponse.json({ data, message: 'Comment deleted', code: 'success', status: 200 })
})
