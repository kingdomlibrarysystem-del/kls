import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createProduct } from '../shop/products/route'
import { POST as createCategory } from '../shop/categories/route'
import { POST as cartPost } from '../shop/cart/route'
import { POST as placeOrderRoute } from '../shop/orders/route'
import { PATCH as patchOrder } from '../shop/orders/[id]/route'
import { POST as mtnWebhook } from '../webhooks/mtn-momo/route'
import { POST as urubutoWebhook } from '../webhooks/urubutopay/route'
import { GET as listMethods } from '../payments/methods/route'
import { PATCH as patchMethod } from '../payments/methods/[method]/route'
import { isAirtelNumber, isMtnNumber, toMsisdn } from '@/lib/payments/http'
import { mapIntouchStatus } from '@/lib/payments/providers/intouch'
import { mapPesapalStatus } from '@/lib/payments/providers/pesapal'
import { mapUrubutoStatus } from '@/lib/payments/providers/urubutopay'

/**
 * The providers ported from Food Bundles, end to end on the TEST database
 * through the shop: the admin switch, phone rules, starting an MTN MoMo
 * payment, and — most important — that a callback is never trusted on its
 * own: the order is only paid once MTN's own status API says SUCCESSFUL.
 * Provider HTTP calls are answered by a stubbed fetch; no real request leaves.
 */
const RUN = `vitest-pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', member: '', category: '', product: '' }
let mtnStatus = 'PENDING'
const mtnCalls: string[] = []

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))

const realFetch = globalThis.fetch
const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url.includes('momoapi.mtn.co.rw')) {
    mtnCalls.push(`${init?.method ?? 'GET'} ${url.replace(/^https?:\/\/[^/]+/, '')}`)
    if (url.endsWith('/collection/token/')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })
    if (url.endsWith('/requesttopay')) return new Response('', { status: 202 })
    if (url.includes('/requesttopay/')) return new Response(JSON.stringify({ status: mtnStatus, financialTransactionId: '123' }), { status: 200 })
  }
  return realFetch(input, init)
})

const json = (url: string, method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const mctx = (method: string) => ({ params: Promise.resolve({ method }) })
const as = (who: 'admin' | 'member') => { session = { id: ids[who], roleName: who === 'admin' ? 'Admin' : 'Member' } }
const ENV_KEYS = ['MTN_MOMO_COLLECTION_PRIMARY_KEY', 'MTN_MOMO_REFERENCE_ID', 'MTN_MOMO_API_KEY', 'URUBUTOPAY_WEBHOOK_TOKEN'] as const
const savedEnv: Record<string, string | undefined> = {}
let savedConfig: { enabled: boolean } | null = null

beforeAll(async () => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
  process.env.MTN_MOMO_COLLECTION_PRIMARY_KEY = 'test-sub-key'
  process.env.MTN_MOMO_REFERENCE_ID = 'test-user'
  process.env.MTN_MOMO_API_KEY = 'test-key'
  process.env.URUBUTOPAY_WEBHOOK_TOKEN = 'test-webhook-token'
  vi.stubGlobal('fetch', fakeFetch)

  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (tag: string, roleId: string) => prisma.user.create({ data: { name: `Vitest ${tag}`, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.admin, ids.member] = await Promise.all([mk('admin', admin.id), mk('member', member.id)])
  savedConfig = await prisma.paymentMethodConfig.findUnique({ where: { method: 'MTN_MOMO' }, select: { enabled: true } })
}, 60_000)

afterAll(async () => {
  vi.unstubAllGlobals()
  for (const k of ENV_KEYS) { if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k] }
  const orders = await prisma.productOrder.findMany({ where: { userId: ids.member }, select: { id: true } })
  await prisma.paymentAttempt.deleteMany({ where: { targetId: { in: orders.map((o) => o.id) } } })
  await prisma.productOrder.deleteMany({ where: { userId: ids.member } })
  await prisma.productCartItem.deleteMany({ where: { userId: ids.member } })
  if (ids.product) await prisma.product.deleteMany({ where: { id: ids.product } })
  if (ids.category) await prisma.productCategory.deleteMany({ where: { id: ids.category } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.admin, ids.member] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.admin, ids.member] } } })
  await prisma.paymentMethodConfig.updateMany({ where: { method: 'MTN_MOMO' }, data: { enabled: savedConfig?.enabled ?? false } })
}, 60_000)

describe('provider helpers', () => {
  it('normalises Rwandan numbers and tells MTN from Airtel', () => {
    expect(toMsisdn('078 123 4567')).toBe('250781234567')
    expect(toMsisdn('+250731234567')).toBe('250731234567')
    expect(toMsisdn('12345')).toBe('')
    expect(isMtnNumber('0791234567')).toBe(true)
    expect(isMtnNumber('0731234567')).toBe(false)
    expect(isAirtelNumber('0721234567')).toBe(true)
  })

  it('maps each provider status to pending / successful / failed', () => {
    expect(mapIntouchStatus('Successfull', '01')).toBe('SUCCESSFUL')
    expect(mapIntouchStatus('Pending', '1000')).toBe('PENDING')
    expect(mapIntouchStatus('Failed')).toBe('FAILED')
    expect(mapPesapalStatus(1)).toBe('SUCCESSFUL')
    expect(mapPesapalStatus(3)).toBe('FAILED')
    expect(mapPesapalStatus(0)).toBe('PENDING')
    expect(mapUrubutoStatus('PENDING_SETTLEMENT')).toBe('SUCCESSFUL')
    expect(mapUrubutoStatus('INITIATED')).toBe('PENDING')
  })
})

describe('MTN MoMo through the shop', () => {
  it('a method is offered only after an admin switches it on; members cannot switch it', async () => {
    as('member')
    expect((await patchMethod(json('/api/payments/methods/MTN_MOMO', 'PATCH', { enabled: true }), mctx('MTN_MOMO'))).status).toBe(403)
    as('admin')
    await patchMethod(json('/api/payments/methods/MTN_MOMO', 'PATCH', { enabled: false }), mctx('MTN_MOMO'))
    const off = (await (await listMethods(json('/api/payments/methods', 'GET'))).json()).data as { method: string }[]
    expect(off.map((o) => o.method)).not.toContain('MTN_MOMO')
    expect((await patchMethod(json('/api/payments/methods/MTN_MOMO', 'PATCH', { enabled: true }), mctx('MTN_MOMO'))).status).toBe(200)
    const on = (await (await listMethods(json('/api/payments/methods', 'GET'))).json()).data as { method: string; kind: string }[]
    expect(on.find((o) => o.method === 'MTN_MOMO')?.kind).toBe('mobile')
    // Credentials missing → cannot be switched on.
    expect((await patchMethod(json('/api/payments/methods/PESAPAL', 'PATCH', { enabled: true }), mctx('PESAPAL'))).status).toBe(409)
  }, 60_000)

  it('places an order with MTN MoMo; an Airtel number is refused for this method', async () => {
    as('admin')
    ids.category = (await (await createCategory(json('/api/shop/categories', 'POST', { name: `Vitest Pay ${RUN}` }))).json()).data.id
    ids.product = (await (await createProduct(json('/api/shop/products', 'POST', {
      title: `Vitest Soap ${RUN}`, description: 'Gentle handmade soap bar.', priceRwf: 2500, images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'], categoryId: ids.category, stockQty: 5, status: 'ACTIVE',
    }))).json()).data.id

    as('member')
    await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 1 }))
    const order = { buyerName: 'Vitest Member', deliveryMethod: 'PICKUP', method: 'MTN_MOMO' }
    expect((await placeOrderRoute(json('/api/shop/orders', 'POST', { ...order, buyerPhone: '0731234567' }))).status).toBe(400)

    const res = await placeOrderRoute(json('/api/shop/orders', 'POST', { ...order, buyerPhone: '0781234567' }))
    expect(res.status).toBe(201)
    const orderId = (await res.json()).data.orderId as string
    const attempt = await prisma.paymentAttempt.findFirstOrThrow({ where: { targetKind: 'PRODUCT_ORDER', targetId: orderId } })
    expect(attempt).toMatchObject({ provider: 'MTN_MOMO', status: 'PENDING', amountRwf: 2500, phone: '0781234567' })
    expect(attempt.providerRef).toMatch(/^[0-9a-f-]{36}$/) // MTN X-Reference-Id
    expect(mtnCalls.some((c) => c.startsWith('POST /collection/v1_0/requesttopay'))).toBe(true)
  }, 60_000)

  it('a callback alone does not mark the order paid — MTN\'s own status decides', async () => {
    const attempt = await prisma.paymentAttempt.findFirstOrThrow({ where: { provider: 'MTN_MOMO', userId: ids.member }, orderBy: { createdAt: 'desc' } })

    mtnStatus = 'PENDING' // forged "SUCCESSFUL" body, but MTN still says pending
    await mtnWebhook(json('/api/webhooks/mtn-momo', 'POST', { externalId: attempt.reference, status: 'SUCCESSFUL' }))
    expect((await prisma.productOrder.findUniqueOrThrow({ where: { id: attempt.targetId } })).status).toBe('PENDING_PAYMENT')

    mtnStatus = 'SUCCESSFUL'
    await mtnWebhook(json('/api/webhooks/mtn-momo', 'POST', { externalId: attempt.reference, status: 'SUCCESSFUL' }))
    expect((await prisma.productOrder.findUniqueOrThrow({ where: { id: attempt.targetId } })).status).toBe('PAID')
    expect((await prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).status).toBe('SUCCESSFUL')

    // A repeated callback does not settle twice (sold count stays 1).
    await mtnWebhook(json('/api/webhooks/mtn-momo', 'POST', { externalId: attempt.reference, status: 'SUCCESSFUL' }))
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ids.product } })).soldCount).toBe(1)
  }, 60_000)

  it('a failed payment frees the stock; the member\'s "check" uses the provider too', async () => {
    as('member')
    await cartPost(json('/api/shop/cart', 'POST', { productId: ids.product, quantity: 2 }))
    mtnStatus = 'PENDING'
    const orderId = (await (await placeOrderRoute(json('/api/shop/orders', 'POST', { buyerName: 'Vitest Member', deliveryMethod: 'PICKUP', method: 'MTN_MOMO', buyerPhone: '0781234567' }))).json()).data.orderId
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ids.product } })).stockQty).toBe(2) // 5 - 1 sold - 2 reserved

    mtnStatus = 'FAILED'
    const check = await patchOrder(json(`/api/shop/orders/${orderId}`, 'PATCH', { action: 'check' }), ctx(orderId))
    expect((await check.json()).data.status).toBe('FAILED')
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ids.product } })).stockQty).toBe(4)
  }, 60_000)
})

describe('UrubutoPay webhook', () => {
  it('refuses callbacks without the shared bearer token', async () => {
    expect((await urubutoWebhook(json('/api/webhooks/urubutopay', 'POST', { callback_type: 'PAYMENT', transaction_id: 'x' }))).status).toBe(401)
    expect((await urubutoWebhook(json('/api/webhooks/urubutopay', 'POST', { callback_type: 'PAYMENT', transaction_id: 'x' }, { Authorization: 'Bearer wrong' }))).status).toBe(401)
    expect((await urubutoWebhook(json('/api/webhooks/urubutopay', 'POST', { callback_type: 'PAYMENT', transaction_id: 'unknown' }, { Authorization: 'Bearer test-webhook-token' }))).status).toBe(200)
  }, 60_000)
})
