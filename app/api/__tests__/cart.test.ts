import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as getCart, POST as addToCart } from '../cart/route'
import { DELETE as removeFromCart } from '../cart/[itemId]/route'

/**
 * Real integration test against the actual configured database — same
 * no-separate-test-DB convention as borrow-reserve-concurrency.test.ts.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
const TEST_EMAIL = `${RUN_ID}@vitest.local`
let testUserId: string
let testResourceId: string

function postRequest(url: string, body: unknown) {
  return new NextRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Cart', firstName: 'Vitest', lastName: 'Cart', email: TEST_EMAIL, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.create({
    data: {
      title: `Vitest Cart Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, isbn: `vitest-cart-${RUN_ID}`, price: 3000, freePreviewChapterCount: 0,
      totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
    },
  })
  testResourceId = resource.id
})

afterAll(async () => {
  const cart = await prisma.cart.findUnique({ where: { userId: testUserId } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.delete({ where: { id: cart.id } })
  }
  await prisma.resource.delete({ where: { id: testResourceId } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('POST /api/cart', () => {
  it('creates a cart and adds an item for a new user', async () => {
    const res = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: testResourceId, type: 'SALE' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].resourceId).toBe(testResourceId)
    expect(json.data.totalRwf).toBe(3000)
  })

  it('adding the same resource+type again does not create a duplicate line item', async () => {
    const res = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: testResourceId, type: 'SALE' }))
    const json = await res.json()
    expect(json.data.items).toHaveLength(1)
  })

  it('rejects a resource with no price set', async () => {
    const freeResource = await prisma.resource.create({
      data: {
        title: `Vitest Free Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
        language: 'EN', year: 2026, pages: 5, isbn: `vitest-free-${RUN_ID}`, price: 0, freePreviewChapterCount: 0,
        totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
      },
    })
    const res = await addToCart(postRequest('http://localhost/api/cart', { userId: testUserId, resourceId: freeResource.id, type: 'SALE' }))
    expect(res.status).toBe(400)
    await prisma.resource.delete({ where: { id: freeResource.id } })
  })
})

describe('GET /api/cart', () => {
  it('returns the real cart with a computed total', async () => {
    const res = await getCart(new NextRequest(`http://localhost/api/cart?userId=${testUserId}`))
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.items).toHaveLength(1)
    expect(json.data.totalRwf).toBe(3000)
  })
})

describe('DELETE /api/cart/[itemId]', () => {
  it('removes the item for real', async () => {
    const before = await getCart(new NextRequest(`http://localhost/api/cart?userId=${testUserId}`))
    const beforeJson = await before.json()
    const itemId = beforeJson.data.items[0].id

    const res = await removeFromCart(new NextRequest(`http://localhost/api/cart/${itemId}`, { method: 'DELETE' }), { params: Promise.resolve({ itemId }) })
    expect(res.status).toBe(200)

    const after = await getCart(new NextRequest(`http://localhost/api/cart?userId=${testUserId}`))
    const afterJson = await after.json()
    expect(afterJson.data.items).toHaveLength(0)
    expect(afterJson.data.totalRwf).toBe(0)
  })
})
