import prisma from '@/prisma/client'
import { isDateKey } from '@/lib/daily-wisdom-shared'
import { notifyUser } from '@/lib/notify'
import { wisdomCommentEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Likes and comments on the Daily Wisdom live for ONE day only (owner's rule):
 * each row carries `expiresAt` = the end of its day, and every read or write
 * first deletes everything that has expired — so the day's likes and comments
 * are really removed from the database, not just hidden. A wisdom shown again
 * on another day starts with no likes and no comments.
 *
 * "The end of its day": the reader's local day `dateKey` ends at different
 * UTC times around the world, so the row expires at 12:00 UTC the next day
 * (00:00 UTC + 36 h) — after midnight everywhere from UTC-12 to UTC+12,
 * and just after midnight in Rwanda (UTC+2) plus a 10-hour margin.
 */
const DAY_LIFETIME_MS = 36 * 60 * 60 * 1000

export const WISDOM_COMMENT_MAX = 500

export interface WisdomComment {
  id: string
  userName: string
  text: string
  createdAt: string
  /** The signed-in member wrote it (they can delete it). */
  mine: boolean
}

export interface WisdomReactions {
  likes: number
  liked: boolean
  comments: WisdomComment[]
}

/** When the likes/comments of `dateKey` are deleted. */
export function wisdomExpiry(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + DAY_LIFETIME_MS)
}

/** Only today (give or take the time zones) can be liked or commented on — not old or future days. */
export function isCurrentWisdomDay(dateKey: string, now = new Date()): boolean {
  if (!isDateKey(dateKey)) return false
  const [y, m, d] = dateKey.split('-').map(Number)
  const dayStart = Date.UTC(y, m - 1, d)
  const t = now.getTime()
  // The reader's local day can start up to 14 h before UTC midnight and end 12 h after the UTC day.
  return t >= dayStart - 14 * 3_600_000 && t < wisdomExpiry(dateKey).getTime()
}

/** Delete every like and comment whose day is over. Cheap (indexed on expiresAt); runs before each read/write. */
export async function purgeExpiredWisdomReactions(now = new Date()): Promise<void> {
  await Promise.all([
    prisma.dailyWisdomLike.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.dailyWisdomComment.deleteMany({ where: { expiresAt: { lt: now } } }),
  ])
}

/** The day's likes and comments for one wisdom (newest comments first). */
export async function getWisdomReactions(verseId: string, dateKey: string, userId: string | null): Promise<WisdomReactions> {
  await purgeExpiredWisdomReactions()
  const [likes, liked, comments] = await Promise.all([
    prisma.dailyWisdomLike.count({ where: { verseId, dateKey } }),
    userId ? prisma.dailyWisdomLike.count({ where: { verseId, dateKey, userId } }) : Promise.resolve(0),
    prisma.dailyWisdomComment.findMany({ where: { verseId, dateKey }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ])
  return {
    likes,
    liked: liked > 0,
    comments: comments.map((c) => ({ id: c.id, userName: c.userName, text: c.text, createdAt: c.createdAt.toISOString(), mine: !!userId && c.userId === userId })),
  }
}

/**
 * A new comment on the Daily Wisdom → in-app notification + email to the person
 * who wrote that wisdom and to every Admin (never to the commenter). Each can
 * turn these emails off with the 'daily-wisdom-comment' notification preference.
 */
export async function notifyWisdomComment(input: { verseId: string; commenterId: string; commenterName: string; comment: string }): Promise<void> {
  const verse = await prisma.dailyVerse.findUnique({ where: { id: input.verseId }, select: { text: true, createdById: true } })
  if (!verse) return
  const admins = await prisma.user.findMany({ where: { role: { name: 'Admin' } }, select: { id: true } })
  const recipientIds = [...new Set([verse.createdById, ...admins.map((a) => a.id)].filter((id): id is string => !!id && id !== input.commenterId))]
  if (recipientIds.length === 0) return
  const users = await prisma.user.findMany({ where: { id: { in: recipientIds } }, select: { id: true, name: true, firstName: true } })
  const url = `${appBaseUrl().replace(/\/+$/, '')}/dashboard/daily-wisdom`
  const preview = input.comment.length > 120 ? `${input.comment.slice(0, 117)}…` : input.comment
  await Promise.all(users.map((u) => notifyUser({
    userId: u.id,
    type: 'SYSTEM',
    category: 'daily-wisdom-comment',
    title: 'New comment on Daily Wisdom',
    message: `${input.commenterName}: "${preview}"`,
    href: '/dashboard/daily-wisdom',
    email: {
      subject: `${input.commenterName} commented on today's Daily Wisdom`,
      html: wisdomCommentEmailHtml(u.firstName || u.name || 'there', input.commenterName, verse.text, input.comment, url),
    },
  })))
}
