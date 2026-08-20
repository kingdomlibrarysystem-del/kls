import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as getReviews, POST as upsertReview } from '../reviews/route'
import { DELETE as deleteReview } from '../reviews/[id]/route'

/**
 * Real integration tests against the actual configured database — same
 * convention as cart.test.ts/chapters-entitlement.test.ts. Covers the
 * real Review model backing Resource.avgRating/reviewCount shown on
 * member library resource cards.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
let testResourceId: string

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: testUserId, roleName: 'Member' } })),
}))

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Review', firstName: 'Vitest', lastName: 'Review', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.create({
    data: {
      title: `Vitest Review Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-review-${RUN_ID}`, price: 1000, freePreviewChapterCount: 0,
      totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })
  testResourceId = resource.id
})

afterAll(async () => {
  await prisma.review.deleteMany({ where: { resourceId: testResourceId } })
  await prisma.resource.delete({ where: { id: testResourceId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('POST /api/reviews', () => {
  it('creates a review and recomputes Resource.avgRating/reviewCount', async () => {
    const res = await upsertReview(postRequest('http://localhost/api/reviews', { userId: testUserId, resourceId: testResourceId, rating: 4, comment: 'Solid read' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.rating).toBe(4)

    const resource = await prisma.resource.findUnique({ where: { id: testResourceId } })
    expect(resource?.avgRating).toBe(4)
    expect(resource?.reviewCount).toBe(1)
  })

  it('upserts (updates) rather than duplicating a second review by the same user', async () => {
    const res = await upsertReview(postRequest('http://localhost/api/reviews', { userId: testUserId, resourceId: testResourceId, rating: 2, comment: 'Changed my mind' }))
    const json = await res.json()
    expect(json.data.rating).toBe(2)

    const all = await prisma.review.findMany({ where: { resourceId: testResourceId } })
    expect(all).toHaveLength(1)

    const resource = await prisma.resource.findUnique({ where: { id: testResourceId } })
    expect(resource?.avgRating).toBe(2)
    expect(resource?.reviewCount).toBe(1)
  })

  it('rejects a rating outside 1-5', async () => {
    const res = await upsertReview(postRequest('http://localhost/api/reviews', { userId: testUserId, resourceId: testResourceId, rating: 6 }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/reviews', () => {
  it('lists reviews for a resource with the reviewer name resolved', async () => {
    const res = await getReviews(new NextRequest(`http://localhost/api/reviews?resourceId=${testResourceId}`))
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].userName).toContain('Vitest')
  })
})

describe('DELETE /api/reviews/[id]', () => {
  it('deletes the review and recomputes the resource back to zero', async () => {
    const review = await prisma.review.findFirst({ where: { resourceId: testResourceId } })
    const res = await deleteReview(new NextRequest(`http://localhost/api/reviews/${review!.id}`, { method: 'DELETE' }), { params: Promise.resolve({ id: review!.id }) })
    expect(res.status).toBe(200)

    const resource = await prisma.resource.findUnique({ where: { id: testResourceId } })
    expect(resource?.avgRating).toBe(0)
    expect(resource?.reviewCount).toBe(0)
  })
})
