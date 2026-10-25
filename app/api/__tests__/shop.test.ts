import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createProduct, GET as listProducts } from '../shop/products/route'
import { PATCH as patchProduct, DELETE as deleteProduct } from '../shop/products/[id]/route'
import { POST as createCategory, GET as listCategoriesRoute } from '../shop/categories/route'
import { DELETE as deleteCategory } from '../shop/categories/[id]/route'
import { POST as cartPost, GET as cartGet } from '../shop/cart/route'
import { POST as placeOrderRoute } from '../shop/orders/route'
import { PATCH as patchOrder } from '../shop/orders/[id]/route'
import { settleProductOrder } from '@/lib/shop/orders'

/**
 * The shop end to end on the TEST database (prisma/client.tsx refuses
 * anything else). The PayPack call is mocked so no real money request is
 * sent; everything else is real: permission, stock reservation, payment
 * settlement, fulfilment and cancellation.
 */
vi.mock('@/lib/paypack', () => ({
  isValidPaypackPhone: (p: string) => /^(\+?25)?(078|079|075|073|072)\d{7}$/.test(p),
  requestCashin: vi.fn(async () => ({ ref: `vitest-ref-${Math.random().toString(36).slice(2)}`, status: 'pending' })),
  findTransaction: vi.fn(async () => ({ status: 'pending' })),
}))

const RUN = `vitest-shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { staff: '', member: '', other: '', category: '', product: '', order: '', order2: '' }
const roleName = `Vitest Shop Staff ${RUN}`

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const as = (who: 'staff' | 'member' | 'other') => { session = { id: ids[who], roleName: who === 'staff' ? roleName : 'Member' } }
const stockOf = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id }, select: { stockQty: true } })).stockQty

const product = () => ({
  title: `Vitest Body Cream ${RUN}`,
  description: 'Rich shea butter cream for dry skin, 250 ml.',
  priceRwf: 8500,
  compareAtPriceRwf: 10000,
  images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
  categoryId: ids.category,
  stockQty: 3,
  status: 'ACTIVE',
})
const checkout = { buyerName: 'Vitest Member', buyerPhone: '0781234567', deliveryMethod: 'PICKUP', method: 'PAYPACK' }

beforeAll(async () => {
  const staffRole = await prisma.role.create({ data: { name: roleName, permissions: ['shop:manage'] } })
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (tag: string, roleId: string) =>
    prisma.user.create({ data: { name: `Vitest ${tag}`, firstName: 'Vitest', lastName: tag, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.staff, ids.member, ids.other] = await Promise.all([mk('staff', staffRole.id), mk('member', member.id), mk('other', member.id)])
}, 60_000)

afterAll(async () => {
  const users = [ids.staff, ids.member, ids.other]
  await prisma.productOrder.deleteMany({ where: { userId: { in: users } } })
  await prisma.productCartItem.deleteMany({ where: { userId: { in: users } } })
  if (ids.product) await prisma.product.deleteMany({ where: { id: ids.product } })
  if (ids.category) await prisma.productCategory.deleteMany({ where: { id: ids.category } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: users } } })
  await prisma.user.deleteMany({ where: { id: { in: users } } })
  await prisma.role.deleteMany({ where: { name: roleName } })
}, 60_000)

describe('shop admin', () => {
  it('members cannot add categories or products', async () => {
    as('member')
    expect((await createCategory(json('/api/shop/categories', 'POST', { name: 'Nope' }))).status).toBe(403)
    expect((await createProduct(json('/api/shop/products', 'POST', { title: 'x' }))).status).toBe(403)
  })

  it('staff with "Manage Shop" add a category and a product that members can see', async () => {
    as('staff')
    const cat = await createCategory(json('/api/shop/categories', 'POST', { name: `Vitest Skin care ${RUN}` }))
    expect(cat.status).toBe(201)
    ids.category = (await cat.json()).data.id

    expect((await createProduct(json('/api/shop/products', 'POST', { ...product(), compareAtPriceRwf: 5000 }))).status).toBe(400) // "was" price must be higher
    const res = await createProduct(json('/api/shop/products', 'POST', product()))
    expect(res.status).toBe(201)
    ids.product = (await res.json()).data.id

    session = null
    const list = (await (await listProducts(json(`/api/shop/products?category=${ids.category}`, 'GET'))).json()).data
    expect(list.map((p: { id: string }) => p.id)).toContain(ids.product)
    const cats = (await (await listCategoriesRoute(json('/api/shop/categories', 'GET'))).json()).data
    expect(cats.map((c: { id: string }) => c.id)).toContain(ids.category)
  }, 60_000)

  it('a category in use cannot be deleted', async () => {
    as('staff')
    expect((await deleteCategory(json(`/api/shop/categories/${ids.category}`, 'DELETE'), ctx(ids.category))).status).toBe(409)
  })
})

describe('buying', () => {
  it('guests must sign in to use the cart; the cart never holds more than the stock', async () => {
    session = null
    expect((await cartGet()).status).toBe(401)
    as('member')
    const res = await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 5 }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.lines[0]).toMatchObject({ productId: ids.product, quantity: 3, unitPriceRwf: 8500 })
    expect(body.message).toContain('Only 3')
    await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 2, mode: 'set' }))
    expect((await (await cartGet()).json()).data).toMatchObject({ itemCount: 2, subtotalRwf: 17000 })
  }, 60_000)

  it('checkout reserves stock and empties the cart; a successful payment marks it paid once', async () => {
    as('member')
    expect((await placeOrderRoute(json('/api/shop/orders', 'POST', { ...checkout, buyerPhone: '123' }))).status).toBe(400)
    const res = await placeOrderRoute(json('/api/shop/orders', 'POST', checkout))
    expect(res.status).toBe(201)
    ids.order = (await res.json()).data.orderId
    expect(await stockOf(ids.product)).toBe(1)
    expect((await (await cartGet()).json()).data.itemCount).toBe(0)

    const order = await prisma.productOrder.findUniqueOrThrow({ where: { id: ids.order } })
    expect(order).toMatchObject({ status: 'PENDING_PAYMENT', totalRwf: 17000, deliveryFeeRwf: 0 })

    await settleProductOrder(ids.order, { providerStatus: 'successful' })
    await settleProductOrder(ids.order, { providerStatus: 'successful' }) // a second callback
    const paid = await prisma.productOrder.findUniqueOrThrow({ where: { id: ids.order } })
    expect(paid.status).toBe('PAID')
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ids.product } })).soldCount).toBe(2)
  }, 60_000)

  it('another member cannot see the order; staff move it along to completed', async () => {
    as('other')
    expect((await patchOrder(json(`/api/shop/orders/${ids.order}`, 'PATCH', { action: 'check' }), ctx(ids.order))).status).toBe(404)
    as('member')
    expect((await patchOrder(json(`/api/shop/orders/${ids.order}`, 'PATCH', { action: 'advance', status: 'PROCESSING' }), ctx(ids.order))).status).toBe(403)
    expect((await patchOrder(json(`/api/shop/orders/${ids.order}`, 'PATCH', { action: 'cancel' }), ctx(ids.order))).status).toBe(409) // already paid

    as('staff')
    for (const status of ['PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED']) {
      const r = await patchOrder(json(`/api/shop/orders/${ids.order}`, 'PATCH', { action: 'advance', status, note: 'Open 9am-5pm' }), ctx(ids.order))
      expect(r.status).toBe(200)
      expect((await r.json()).data.status).toBe(status)
    }
    expect((await patchOrder(json(`/api/shop/orders/${ids.order}`, 'PATCH', { action: 'advance', status: 'PROCESSING' }), ctx(ids.order))).status).toBe(409)
  }, 60_000)

  it('a failed payment or a cancelled order gives the stock back (once)', async () => {
    as('member')
    await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 1 }))
    const r1 = await placeOrderRoute(json('/api/shop/orders', 'POST', checkout))
    const failedId = (await r1.json()).data.orderId
    expect(await stockOf(ids.product)).toBe(0)
    await settleProductOrder(failedId, { providerStatus: 'failed' })
    await settleProductOrder(failedId, { providerStatus: 'failed' })
    expect(await stockOf(ids.product)).toBe(1)
    expect((await prisma.productOrder.findUniqueOrThrow({ where: { id: failedId } })).status).toBe('FAILED')

    await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 1 }))
    const r2 = await placeOrderRoute(json('/api/shop/orders', 'POST', checkout))
    ids.order2 = (await r2.json()).data.orderId
    expect(await stockOf(ids.product)).toBe(0)
    expect((await patchOrder(json(`/api/shop/orders/${ids.order2}`, 'PATCH', { action: 'cancel' }), ctx(ids.order2))).status).toBe(200)
    expect(await stockOf(ids.product)).toBe(1)

    // Sold out: nothing left after a third member buys the last one, so the next add is refused.
    await prisma.product.update({ where: { id: ids.product }, data: { stockQty: 0 } })
    expect((await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 1 }))).status).toBe(409)
  }, 60_000)

  it('a product moved to Trash leaves the shop and can be restored', async () => {
    as('staff')
    await prisma.product.update({ where: { id: ids.product }, data: { stockQty: 2 } })
    expect((await deleteProduct(json(`/api/shop/products/${ids.product}`, 'DELETE'), ctx(ids.product))).status).toBe(200)
    session = null
    const list = (await (await listProducts(json('/api/shop/products', 'GET'))).json()).data
    expect(list.map((p: { id: string }) => p.id)).not.toContain(ids.product)
    as('staff')
    expect((await patchProduct(json(`/api/shop/products/${ids.product}`, 'PATCH', { restore: true }), ctx(ids.product))).status).toBe(200)
  }, 60_000)
})
