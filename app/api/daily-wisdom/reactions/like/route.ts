import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { getWisdomReactions, purgeExpiredWisdomReactions, reactionExpiry } from '@/lib/data/daily-wisdom-reactions'
import { assertWisdomDay } from '../_shared'

/** POST /api/daily-wisdom/reactions/like { verseId, date } — like / unlike today's wisdom (signed in). */
export const POST = withErrorHandling('/api/daily-wisdom/reactions/like', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const body = await request.json().catch(() => ({}))
  const { verseId, dateKey } = await assertWisdomDay(body.verseId, body.date)
  const userId = auth.session.userId

  await purgeExpiredWisdomReactions()
  const existing = await prisma.dailyWisdomLike.findFirst({ where: { verseId, dateKey, userId }, select: { id: true } })
  if (existing) {
    await prisma.dailyWisdomLike.delete({ where: { id: existing.id } })
  } else {
    // A double tap can race to create twice; the unique index keeps one — ignore the duplicate.
    await prisma.dailyWisdomLike.create({ data: { verseId, dateKey, userId, expiresAt: reactionExpiry() } }).catch((e) => {
      if ((e as { code?: string }).code !== 'P2002') throw e
    })
  }
  const data = await getWisdomReactions(verseId, dateKey, userId)
  return NextResponse.json({ data, message: existing ? 'Like removed' : 'Liked', code: 'success', status: 200 })
})
