import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/prisma/client'
import { isEntitled, gateChapters, serializeChapter } from '../chapters/route'

/**
 * Real integration test against the actual configured database (no
 * separate test DB exists — see borrow-reserve-concurrency.test.ts for
 * the same pattern). Exercises the real entitlement gate added to
 * /api/chapters, which previously was a fully public, ungated route —
 * anyone could read any resource's full chapter text regardless of price.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
let testResourceId: string
let testOrderId: string

const CHAPTERS = [
  { id: 'c1', title: 'Chapter 1', body: 'first', order: 0, resourceId: '' },
  { id: 'c2', title: 'Chapter 2', body: 'second', order: 1, resourceId: '' },
  { id: 'c3', title: 'Chapter 3', body: 'third', order: 2, resourceId: '' },
]

// Order.paypackRef is String? @unique — on Mongo, multiple rows with a null
// value there still collide on the unique index, so every test order needs
// its own distinct fake ref.
let paypackRefCounter = 0
function nextPaypackRef() {
  paypackRefCounter += 1
  return `${RUN_ID}-${paypackRefCounter}`
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Entitlement', firstName: 'Vitest', lastName: 'Entitlement', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.create({
    data: {
      title: `Vitest Test Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-${RUN_ID}`, price: 5000, freePreviewChapterCount: 1,
      totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })
  testResourceId = resource.id
  CHAPTERS.forEach((c) => { c.resourceId = testResourceId })
})

afterAll(async () => {
  if (testOrderId) await prisma.order.deleteMany({ where: { id: testOrderId } })
  await prisma.resource.delete({ where: { id: testResourceId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('isEntitled', () => {
  it('is false for a user with no Order/Borrow/Reservation for the resource', async () => {
    expect(await isEntitled(testUserId, testResourceId)).toBe(false)
  })

  it('is true once a PAID Order exists for that user+resource', async () => {
    const order = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: TEST_EMAIL, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 5000, status: 'PAID', paypackRef: nextPaypackRef(),
      },
    })
    testOrderId = order.id
    expect(await isEntitled(testUserId, testResourceId)).toBe(true)
  })

  it('is false for a PENDING (unconfirmed) Order', async () => {
    const pendingOrder = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: TEST_EMAIL, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 5000, status: 'PENDING', paypackRef: nextPaypackRef(),
      },
    })
    await prisma.order.delete({ where: { id: testOrderId } })
    expect(await isEntitled(testUserId, testResourceId)).toBe(false)
    await prisma.order.delete({ where: { id: pendingOrder.id } })
    testOrderId = ''
  })
})

describe('gateChapters', () => {
  const resource = { id: 'r1', price: 5000, freePreviewChapterCount: 1 }
  const freeResource = { id: 'r2', price: 0, freePreviewChapterCount: 0 }

  it('returns every chapter unlocked for a free resource, regardless of entitlement', async () => {
    const result = await gateChapters(freeResource, CHAPTERS, undefined, false)
    expect(result.every((c) => !c.locked && c.body !== undefined)).toBe(true)
  })

  it('returns every chapter unlocked for staff, regardless of price or entitlement', async () => {
    const result = await gateChapters(resource, CHAPTERS, undefined, true)
    expect(result.every((c) => !c.locked && c.body !== undefined)).toBe(true)
  })

  it('locks chapters past freePreviewChapterCount for an unauthenticated request on a priced resource', async () => {
    const result = await gateChapters(resource, CHAPTERS, undefined, false)
    expect(result[0].locked).toBe(false)
    expect(result[0].body).toBe('first')
    expect(result[1].locked).toBe(true)
    expect(result[1].body).toBeUndefined()
    expect(result[2].locked).toBe(true)
  })

  it('unlocks every chapter for a genuinely entitled real user (integration path)', async () => {
    const order = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: TEST_EMAIL, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 5000, status: 'PAID', paypackRef: nextPaypackRef(),
      },
    })
    testOrderId = order.id
    const result = await gateChapters({ id: testResourceId, price: 5000, freePreviewChapterCount: 1 }, CHAPTERS, testUserId, false)
    expect(result.every((c) => !c.locked)).toBe(true)
  })
})

describe('serializeChapter', () => {
  it('omits body when locked, includes it when unlocked', () => {
    const chapter = { id: 'c1', title: 'Chapter 1', body: 'secret text', order: 0, resourceId: 'r1' }
    expect(serializeChapter(chapter, true)).toMatchObject({ locked: true, body: undefined })
    expect(serializeChapter(chapter, false)).toMatchObject({ locked: false, body: 'secret text' })
  })
})
