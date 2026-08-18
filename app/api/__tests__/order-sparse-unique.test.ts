import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/prisma/client'

/**
 * Real regression test against the actual configured database (no
 * separate test DB exists — same convention as
 * borrow-reserve-concurrency.test.ts). Guards against a real bug found
 * while building the cart feature: Order.paypackRef/stripeSessionId are
 * intentionally NOT `@unique` in schema.prisma (see their docstrings)
 * because Prisma's MongoDB connector can't express a sparse unique
 * index — a plain `@unique` there meant the SECOND Order ever created
 * (every new Order starts with both fields unset) threw a 500,
 * confirmed by direct reproduction. The real uniqueness guarantee comes
 * from a sparse unique index created out-of-band via
 * scripts/create-order-sparse-indexes.mjs. This test would fail loudly
 * if that index were ever dropped (e.g. by a future `prisma db push`
 * that doesn't know about it) or if `@unique` were mistakenly
 * reintroduced to the schema.
 */
const RUN_ID = `vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`
let testUserId: string
let testResourceId: string
const createdOrderIds: string[] = []

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const user = await prisma.user.create({
    data: { name: 'Vitest Sparse', firstName: 'Vitest', lastName: 'Sparse', email: `${RUN_ID}@vitest.local`, roleId: role.id, status: 'ACTIVE' },
  })
  testUserId = user.id

  const resource = await prisma.resource.findFirst({ select: { id: true } })
  if (!resource) throw new Error('No Resource rows exist to test against — seed the database first')
  testResourceId = resource.id
})

afterAll(async () => {
  if (createdOrderIds.length) await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } })
  await prisma.user.delete({ where: { id: testUserId } })
})

describe('Order.paypackRef / stripeSessionId sparse uniqueness', () => {
  it('allows multiple Orders with unset paypackRef and stripeSessionId (the real create-then-confirm flow)', async () => {
    const makeOrder = () => prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: `${RUN_ID}@vitest.local`, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 100, status: 'PENDING',
      },
    })

    const order1 = await makeOrder()
    const order2 = await makeOrder()
    const order3 = await makeOrder()
    createdOrderIds.push(order1.id, order2.id, order3.id)

    expect(order1.paypackRef).toBeNull()
    expect(order2.paypackRef).toBeNull()
    expect(order3.paypackRef).toBeNull()
  })

  it('still enforces real uniqueness once paypackRef is actually set', async () => {
    const order1 = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: `${RUN_ID}@vitest.local`, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 100, status: 'PENDING', paypackRef: `${RUN_ID}-dup`,
      },
    })
    createdOrderIds.push(order1.id)

    await expect(
      prisma.order.create({
        data: {
          userId: testUserId, buyerName: 'Vitest', buyerEmail: `${RUN_ID}@vitest.local`, buyerPhone: '0780000000',
          resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
          amountRwf: 100, status: 'PENDING', paypackRef: `${RUN_ID}-dup`,
        },
      })
    ).rejects.toThrow()
  })

  it('still enforces real uniqueness once stripeSessionId is actually set', async () => {
    const order1 = await prisma.order.create({
      data: {
        userId: testUserId, buyerName: 'Vitest', buyerEmail: `${RUN_ID}@vitest.local`, buyerPhone: '0780000000',
        resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
        amountRwf: 100, status: 'PENDING', stripeSessionId: `${RUN_ID}-stripe-dup`,
      },
    })
    createdOrderIds.push(order1.id)

    await expect(
      prisma.order.create({
        data: {
          userId: testUserId, buyerName: 'Vitest', buyerEmail: `${RUN_ID}@vitest.local`, buyerPhone: '0780000000',
          resourceId: testResourceId, resourceTitle: 'Test', resourceFormat: 'TEXT', type: 'SALE',
          amountRwf: 100, status: 'PENDING', stripeSessionId: `${RUN_ID}-stripe-dup`,
        },
      })
    ).rejects.toThrow()
  })
})
