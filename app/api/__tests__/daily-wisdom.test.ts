import { describe, it, expect, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as getToday } from '../daily-wisdom/route'
import { GET as listVerses, POST as createVerse } from '../daily-wisdom/verses/route'
import { PATCH as updateVerse, DELETE as deleteVerse } from '../daily-wisdom/verses/[id]/route'
import { isDateKey, pickAutomaticVerse, pickTodayVerse, type DailyVerseItem } from '@/lib/daily-wisdom-shared'

/**
 * Daily Wisdom: the pure "which verse shows today" rule, and real
 * integration tests against the configured database for the public and
 * staff endpoints (same convention as media-types.test.ts). Test rows use a
 * far-future date and a marker reference, and are removed afterwards.
 */
const RUN = `${Date.now()}`
const DAY = '2099-01-15'
let session: { id: string; roleName: string } | null = null
const created: string[] = []

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const req = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const admin = { id: '000000000000000000000001', roleName: 'Admin' }

afterAll(async () => {
  await prisma.dailyVerse.deleteMany({ where: { OR: [{ id: { in: created } }, { reference: { startsWith: `Vitest ${RUN}` } }] } })
}, 60_000)

const v = (over: Partial<DailyVerseItem>): DailyVerseItem => ({
  id: Math.random().toString(36).slice(2), text: 'Text', reference: 'Ref', language: 'en', scheduledDate: null,
  active: true, createdByName: 'T', createdAt: '2026-01-01T00:00:00.000Z', ...over,
})

describe('pickTodayVerse', () => {
  it('a verse sent for the day wins over the automatic rotation', () => {
    const list = [v({ id: 'auto' }), v({ id: 'sent', scheduledDate: DAY })]
    expect(pickTodayVerse(list, DAY, 'en')).toMatchObject({ id: 'sent', source: 'sent' })
    expect(pickTodayVerse(list, '2099-01-16', 'en')).toMatchObject({ id: 'auto', source: 'automatic' })
  })

  it('prefers the reader\'s language, falls back to another one, ignores inactive verses', () => {
    const list = [v({ id: 'en-sent', scheduledDate: DAY }), v({ id: 'fr-auto', language: 'fr' }), v({ id: 'rw-off', language: 'rw', active: false })]
    expect(pickTodayVerse(list, DAY, 'fr')?.id).toBe('fr-auto')
    expect(pickTodayVerse(list, DAY, 'rw')?.id).toBe('en-sent')
    expect(pickTodayVerse([v({ active: false })], DAY, 'en')).toBeNull()
  })

  it('the automatic verse changes each day and cycles through the pool', () => {
    const pool = ['a', 'b', 'c'].map((id, i) => ({ id, createdAt: `2026-01-0${i + 1}T00:00:00.000Z` }))
    const picks = ['2099-01-01', '2099-01-02', '2099-01-03', '2099-01-04'].map((d) => pickAutomaticVerse(pool, d)?.id)
    expect(new Set(picks.slice(0, 3)).size).toBe(3)
    expect(picks[3]).toBe(picks[0])
  })

  it('validates calendar dates', () => {
    expect(isDateKey('2026-02-28')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('14/10/2026')).toBe(false)
  })
})

describe('/api/daily-wisdom', () => {
  it('rejects a bad date or language', async () => {
    expect((await getToday(req('/api/daily-wisdom?date=nope&lang=en'))).status).toBe(400)
    expect((await getToday(req(`/api/daily-wisdom?date=${DAY}&lang=de`))).status).toBe(400)
  })

  it('only staff can list or create verses', async () => {
    session = null
    expect((await listVerses()).status).toBe(401)
    session = { id: admin.id, roleName: 'Member' }
    expect((await createVerse(req('/api/daily-wisdom/verses', 'POST', { text: 'Hello world', reference: 'X 1:1', language: 'en', scheduledDate: DAY }))).status).toBe(403)
  })

  it('a sent verse shows on its day, one per day per language, and can be switched off and deleted', async () => {
    session = admin
    const body = { text: 'Be still, and know that I am God.', reference: `Vitest ${RUN} Psalm 46:10`, language: 'en', scheduledDate: DAY }
    const res = await createVerse(req('/api/daily-wisdom/verses', 'POST', body))
    expect(res.status).toBe(201)
    const verse = (await res.json()).data
    created.push(verse.id)

    expect((await createVerse(req('/api/daily-wisdom/verses', 'POST', body))).status).toBe(409)

    session = null
    let today = (await (await getToday(req(`/api/daily-wisdom?date=${DAY}&lang=en`))).json()).data
    expect(today).toMatchObject({ id: verse.id, source: 'sent', reference: body.reference })

    session = admin
    expect((await updateVerse(req(`/api/daily-wisdom/verses/${verse.id}`, 'PATCH', { active: false }), ctx(verse.id))).status).toBe(200)
    today = (await (await getToday(req(`/api/daily-wisdom?date=${DAY}&lang=en`))).json()).data
    expect(today?.id).not.toBe(verse.id)

    expect((await deleteVerse(req(`/api/daily-wisdom/verses/${verse.id}`, 'DELETE'), ctx(verse.id))).status).toBe(200)
    expect((await deleteVerse(req(`/api/daily-wisdom/verses/${verse.id}`, 'DELETE'), ctx(verse.id))).status).toBe(404)
  }, 60_000)
})
