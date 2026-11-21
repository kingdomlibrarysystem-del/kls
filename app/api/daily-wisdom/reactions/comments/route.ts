import { NextRequest, NextResponse, after } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { getWisdomReactions, notifyWisdomComment, purgeExpiredWisdomReactions, wisdomExpiry, WISDOM_COMMENT_MAX } from '@/lib/data/daily-wisdom-reactions'
import { assertWisdomDay } from '../_shared'

/** POST /api/daily-wisdom/reactions/comments { verseId, date, text } — comment on today's wisdom (signed in). */
export const POST = withErrorHandling('/api/daily-wisdom/reactions/comments', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const body = await request.json().catch(() => ({}))
  const { verseId, dateKey } = await assertWisdomDay(body.verseId, body.date)
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) throw new ApiError('Write something first', 400)
  if (text.length > WISDOM_COMMENT_MAX) throw new ApiError(`Keep it under ${WISDOM_COMMENT_MAX} characters`, 400)

  const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true, firstName: true, lastName: true } })
  const userName = (user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Member'

  await purgeExpiredWisdomReactions()
  await prisma.dailyWisdomComment.create({ data: { verseId, dateKey, userId: auth.session.userId, userName, text, expiresAt: wisdomExpiry(dateKey) } })
  // Tell the wisdom's writer and the admins (email + in-app). Never blocks or fails the comment itself.
  // after(): runs once the reply is sent (kept alive on Vercel), so the comment never waits for Gmail.
  const notify = () => notifyWisdomComment({ verseId, commenterId: auth.session.userId, commenterName: userName, comment: text }).catch((e) => console.error('Wisdom comment notification failed:', e))
  try { after(notify) } catch { void notify() } // outside a request (tests): just run it
  const data = await getWisdomReactions(verseId, dateKey, auth.session.userId)
  return NextResponse.json({ data, message: 'Comment added', code: 'success', status: 201 }, { status: 201 })
})
