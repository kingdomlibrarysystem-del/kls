import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { isObjectId } from '@/lib/server/object-id'
import { isCurrentWisdomDay } from '@/lib/data/daily-wisdom-reactions'

/** The wisdom must exist and be switched on, and the day must be today (likes/comments last one day). */
export async function assertWisdomDay(verseId: unknown, dateKey: unknown): Promise<{ verseId: string; dateKey: string }> {
  if (typeof verseId !== 'string' || !isObjectId(verseId)) throw new ApiError('Unknown wisdom', 400)
  if (typeof dateKey !== 'string' || !isCurrentWisdomDay(dateKey)) throw new ApiError('This wisdom is for another day', 400)
  const verse = await prisma.dailyVerse.findUnique({ where: { id: verseId }, select: { active: true } })
  if (!verse?.active) throw new ApiError('Unknown wisdom', 404)
  return { verseId, dateKey }
}
