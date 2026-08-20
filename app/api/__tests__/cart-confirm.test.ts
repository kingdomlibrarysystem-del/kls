import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as addToCart } from '../cart/route'
import { POST as confirmCartItem } from '../cart/[itemId]/confirm/route'

/**
 * Real integration tests against the actual configured database — same
 * convention as cart.test.ts. Covers resolving a BORROW/RESERVE cart
 * item into a real Borrow/Reservation row via the exact same route
 * handlers the direct (non-cart) buttons already use.
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
    data: { name: 'Vitest Confirm', firstName: 'Vitest', lastName: 'Confirm', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.create({
    data: {
      title: `Vitest Confirm Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-confirm-${RUN_ID}`, price: 0, freePreviewChapterCount: 0,
      totalQty: 2, availableQty: 2, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })
  testResourceId = resource.id
})

afterAll(async () => {
  await prisma.borrow.deleteMany({ where: { userId: testUserId } })
  await prisma.reservation.deleteMany({ where: { userId: testUserId } })
  const cart = await prisma.cart.findUnique({ where: { userId: testUserId } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.delete({ where: { id: cart.id } })
  }
  await prisma.resource.delete({ where: { id: testResourceId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('POST /api/cart/[itemId]/confirm', () => {
  it('resolves a BORROW cart item into a real Borrow row and removes the cart item', async () => {
    const added = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: testResourceId, type: 'BORROW' }))
    const addedJson = await added.json()
    const itemId = addedJson.data.items.find((i: { type: string }) => i.type === 'BORROW').id

    const res = await confirmCartItem(new NextRequest(`http://localhost/api/cart/${itemId}/confirm`, { method: 'POST' }), { params: Promise.resolve({ itemId }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.status).toBe('pending')

    const remaining = await prisma.cartItem.findUnique({ where: { id: itemId } })
    expect(remaining).toBeNull()

    const borrow = await prisma.borrow.findFirst({ where: { userId: testUserId, resourceId: testResourceId } })
    expect(borrow).toBeTruthy()
  })

  it('resolves a RESERVE cart item into a real Reservation row', async () => {
    const added = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: testResourceId, type: 'RESERVE' }))
    const addedJson = await added.json()
    const itemId = addedJson.data.items.find((i: { type: string }) => i.type === 'RESERVE').id

    const res = await confirmCartItem(new NextRequest(`http://localhost/api/cart/${itemId}/confirm`, { method: 'POST' }), { params: Promise.resolve({ itemId }) })
    expect(res.status).toBe(201)

    const reservation = await prisma.reservation.findFirst({ where: { userId: testUserId, resourceId: testResourceId } })
    expect(reservation).toBeTruthy()
    expect(reservation?.queuePosition).toBeGreaterThan(0)
  })

  it('rejects confirming a SALE cart item', async () => {
    const saleResource = await prisma.resource.create({
      data: {
        title: `Vitest Confirm Sale Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
        language: 'EN', year: 2026, pages: 5, isbn: `vitest-confirm-sale-${RUN_ID}`, price: 1000, freePreviewChapterCount: 0,
        totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
      },
    })
    const added = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: saleResource.id, type: 'SALE' }))
    const addedJson = await added.json()
    const itemId = addedJson.data.items.find((i: { resourceId: string; type: string }) => i.resourceId === saleResource.id && i.type === 'SALE').id

    const res = await confirmCartItem(new NextRequest(`http://localhost/api/cart/${itemId}/confirm`, { method: 'POST' }), { params: Promise.resolve({ itemId }) })
    expect(res.status).toBe(400)

    await prisma.cartItem.delete({ where: { id: itemId } })
    await prisma.resource.delete({ where: { id: saleResource.id } })
  })
})
