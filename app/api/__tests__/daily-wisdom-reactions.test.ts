import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as getReactions } from '../daily-wisdom/reactions/route'
import { POST as toggleLike } from '../daily-wisdom/reactions/like/route'
import { POST as addComment } from '../daily-wisdom/reactions/comments/route'
import { DELETE as deleteComment } from '../daily-wisdom/reactions/comments/[id]/route'
import { ensureWisdomTtlIndexes, reactionExpiry, REACTION_LIFETIME_MS, wisdomDayEnd } from '@/lib/data/daily-wisdom-reactions'

/**
 * Likes and comments on the Daily Wisdom last ONE day, then are deleted.
 * TEST database only.
 */
const RUN = `vitest-wr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const TODAY = new Date().toISOString().slice(0, 10)
let session: { id: string; roleName: string } | null = null
const ids = { alice: '', bob: '', admin: '', verse: '' }

// No real email in tests: record what would be sent.
const sentMail = vi.hoisted(() => [] as { to: string; subject: string; html: string }[])
vi.mock('@/lib/mailer', () => ({ sendMail: vi.fn(async (to: string, subject: string, html: string) => { sentMail.push({ to, subject, html }) }), appBaseUrl: () => 'http://localhost' }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const read = async (date = TODAY) => getReactions(req(`/api/daily-wisdom/reactions?verseId=${ids.verse}&date=${date}`, 'GET'))
const as = (who: 'alice' | 'bob' | null) => { session = who ? { id: ids[who], roleName: 'Member' } : null }

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (n: string) => prisma.user.create({ data: { name: `Vitest ${n}`, email: `${RUN}-${n}@vitest.local`, roleId: role.id, status: 'ACTIVE' } }).then((u) => u.id)
  ids.alice = await mk('Alice')
  ids.bob = await mk('Bob')
  const adminRole = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ids.admin = (await prisma.user.create({ data: { name: 'Vitest Admin', firstName: 'Grace', email: `${RUN}-admin@vitest.local`, roleId: adminRole.id, status: 'ACTIVE' } })).id
  ids.verse = (await prisma.dailyVerse.create({ data: { text: `Vitest wisdom ${RUN}`, reference: 'Vitest', language: 'en', scheduledDate: TODAY, createdByName: 'Vitest' } })).id
}, 60_000)

afterAll(async () => {
  await prisma.dailyWisdomLike.deleteMany({ where: { verseId: ids.verse } })
  await prisma.dailyWisdomComment.deleteMany({ where: { verseId: ids.verse } })
  await prisma.dailyVerse.deleteMany({ where: { id: ids.verse } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.alice, ids.bob, ids.admin] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.alice, ids.bob, ids.admin] } } })
}, 60_000)

describe('likes and comments on today\'s wisdom', () => {
  it('a member likes and unlikes; everyone sees the count', async () => {
    as('alice')
    let res = await toggleLike(req('/api/daily-wisdom/reactions/like', 'POST', { verseId: ids.verse, date: TODAY }))
    expect((await res.json()).data).toMatchObject({ likes: 1, liked: true })
    as(null)
    expect((await (await read()).json()).data).toMatchObject({ likes: 1, liked: false })
    as('alice')
    res = await toggleLike(req('/api/daily-wisdom/reactions/like', 'POST', { verseId: ids.verse, date: TODAY }))
    expect((await res.json()).data).toMatchObject({ likes: 0, liked: false })
    as(null)
    expect((await toggleLike(req('/api/daily-wisdom/reactions/like', 'POST', { verseId: ids.verse, date: TODAY }))).status).toBe(401)
  }, 60_000)

  it('comments: add, only the writer deletes, empty refused', async () => {
    as('alice')
    const res = await addComment(req('/api/daily-wisdom/reactions/comments', 'POST', { verseId: ids.verse, date: TODAY, text: 'Amen, thank you' }))
    expect(res.status).toBe(201)
    const comment = (await res.json()).data.comments[0]
    expect(comment).toMatchObject({ text: 'Amen, thank you', mine: true, userName: 'Vitest Alice' })
    expect((await addComment(req('/api/daily-wisdom/reactions/comments', 'POST', { verseId: ids.verse, date: TODAY, text: '   ' }))).status).toBe(400)

    as('bob')
    expect((await deleteComment(req(`/x/${comment.id}`, 'DELETE'), { params: Promise.resolve({ id: comment.id }) })).status).toBe(403)
    as('alice')
    const del = await deleteComment(req(`/x/${comment.id}`, 'DELETE'), { params: Promise.resolve({ id: comment.id }) })
    expect((await del.json()).data.comments).toHaveLength(0)
  }, 60_000)

  it('another day cannot be liked or commented on', async () => {
    as('alice')
    expect((await toggleLike(req('/api/daily-wisdom/reactions/like', 'POST', { verseId: ids.verse, date: '2020-01-01' }))).status).toBe(400)
    expect((await read('2020-01-01')).status).toBe(400)
  }, 60_000)

  it('after 24 hours, the likes and comments are deleted from the database', async () => {
    const past = new Date(Date.now() - 60_000)
    await prisma.dailyWisdomLike.create({ data: { verseId: ids.verse, dateKey: TODAY, userId: ids.bob, expiresAt: past } })
    await prisma.dailyWisdomComment.create({ data: { verseId: ids.verse, dateKey: TODAY, userId: ids.bob, userName: 'Vitest Bob', text: 'old', expiresAt: past } })
    as(null)
    expect((await (await read()).json()).data).toMatchObject({ likes: 0, comments: [] })
    expect(await prisma.dailyWisdomLike.count({ where: { verseId: ids.verse, userId: ids.bob } })).toBe(0)
    expect(await prisma.dailyWisdomComment.count({ where: { verseId: ids.verse, userId: ids.bob } })).toBe(0)
  }, 60_000)

  it('a like or comment expires exactly 24 h after it is added', async () => {
    const added = new Date('2026-11-19T23:50:00.000Z')
    expect(reactionExpiry(added).toISOString()).toBe('2026-11-20T23:50:00.000Z')
    as('alice')
    const before = Date.now()
    await addComment(req('/api/daily-wisdom/reactions/comments', 'POST', { verseId: ids.verse, date: TODAY, text: 'Timed' }))
    const row = await prisma.dailyWisdomComment.findFirstOrThrow({ where: { verseId: ids.verse, text: 'Timed' } })
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeGreaterThanOrEqual(REACTION_LIFETIME_MS - 5_000)
    expect(row.expiresAt.getTime()).toBeLessThanOrEqual(before + REACTION_LIFETIME_MS + 60_000)
  }, 60_000)

  it('MongoDB has a 24 h TTL index, so rows are removed on time even if nobody visits', async () => {
    await ensureWisdomTtlIndexes()
    for (const collection of ['DailyWisdomLike', 'DailyWisdomComment']) {
      const res = (await prisma.$runCommandRaw({ listIndexes: collection })) as { cursor: { firstBatch: { key: Record<string, number>; expireAfterSeconds?: number }[] } }
      expect(res.cursor.firstBatch.some((i) => i.key.createdAt === 1 && i.expireAfterSeconds === 86_400)).toBe(true)
    }
  }, 60_000)

  it('a day can be reacted to until 36 h after its UTC midnight (after midnight in every time zone)', () => {
    expect(wisdomDayEnd('2026-11-19').toISOString()).toBe('2026-11-20T12:00:00.000Z')
  })
})

describe('a comment tells the admins', () => {
  it('admins get an in-app notification and an email with the comment (made safe), the commenter does not', async () => {
    as('alice')
    sentMail.length = 0
    const res = await addComment(req('/api/daily-wisdom/reactions/comments', 'POST', { verseId: ids.verse, date: TODAY, text: 'Blessed <b>day</b>' }))
    expect(res.status).toBe(201)
    // The notification runs after the reply; wait for it.
    // (Earlier comments notify the admin too, possibly late — pick the email about THIS comment.)
    const forThis = (m: { to: string; html: string }) => m.to === `${RUN}-admin@vitest.local` && m.html.includes("Blessed")
    for (let i = 0; i < 40 && !sentMail.some(forThis); i++) await new Promise((r) => setTimeout(r, 250))
    const mail = sentMail.find(forThis)
    expect(mail?.subject).toBe("Vitest Alice commented on today's Daily Wisdom")
    expect(mail?.html).toContain('Hi Grace')
    expect(mail?.html).toContain('Blessed &lt;b&gt;day&lt;/b&gt;')
    expect(sentMail.some((m) => m.to === `${RUN}-Alice@vitest.local`)).toBe(false)
    // (The earlier comment test notified the admin too — check the one for THIS comment.)
    expect(await prisma.notification.count({ where: { recipientId: ids.admin, title: 'New comment on Daily Wisdom', message: { contains: 'Blessed' } } })).toBe(1)
  }, 60_000)
})
