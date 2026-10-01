import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as recordView } from '../resource-views/route'
import { getTrendingBooks } from '@/lib/data/home'

/**
 * Real integration tests against the configured database (same convention as
 * reviews.test.ts) for POST /api/resource-views — the "Read" click on the
 * landing page's trending books — and the trending ranking built on it.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
let resourceId: string
let userId: string
let session: { id: string; roleName: string } | null = null

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/resource-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': RUN_ID },
    body: JSON.stringify(body),
  })

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  userId = (await prisma.user.create({ data: { name: 'Vitest Viewer', firstName: 'Vitest', lastName: 'Viewer', email: `${RUN_ID}@vitest.local`, roleId: role.id, status: 'ACTIVE' } })).id
  resourceId = (await prisma.resource.create({
    data: {
      title: `Vitest Views Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-views-${RUN_ID}`, price: 0, freePreviewChapterCount: 0,
      totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })).id
}, 60_000)

afterAll(async () => {
  await prisma.resourceView.deleteMany({ where: { resourceId } })
  await prisma.resource.delete({ where: { id: resourceId } })
  await prisma.user.delete({ where: { id: userId } })
}, 60_000)

describe('POST /api/resource-views', () => {
  it('rejects a signed-out call without an anonymous id, and unknown resources', async () => {
    session = null
    expect((await recordView(post({ resourceId }))).status).toBe(400)
    expect((await recordView(post({ resourceId: '000000000000000000000000', anonymousId: 'anon-12345678' }))).status).toBe(404)
  })

  it('counts each viewer once: repeat clicks do not inflate the total', async () => {
    session = null
    let res = await recordView(post({ resourceId, anonymousId: 'anon-aaaaaaaa' }))
    expect(res.status).toBe(200)
    expect((await res.json()).data.views).toBe(1)

    res = await recordView(post({ resourceId, anonymousId: 'anon-aaaaaaaa' }))
    expect((await res.json()).data.views).toBe(1)

    res = await recordView(post({ resourceId, anonymousId: 'anon-bbbbbbbb' }))
    expect((await res.json()).data.views).toBe(2)
  })

  it('a signed-in reader is one viewer regardless of browser id', async () => {
    session = { id: userId, roleName: 'Member' }
    let res = await recordView(post({ resourceId, anonymousId: 'anon-cccccccc' }))
    expect((await res.json()).data.views).toBe(3)
    res = await recordView(post({ resourceId }))
    expect((await res.json()).data.views).toBe(3)
  })

  it('viewed books are returned by getTrendingBooks with their view count', async () => {
    const books = await getTrendingBooks(50)
    const mine = books.find((b) => b.id === resourceId)
    expect(mine?.views).toBe(3)
  })
})
