import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as addCategory } from '../shop/categories/route'
import { PATCH as editCategory } from '../shop/categories/[id]/route'
import { getProgramProducts, serializeProgram } from '@/lib/services/data'

/**
 * Shop categories linked to a service programme (optional) on the TEST
 * database: the programme's pages get the category's products; products
 * picked on a sub-service come along too, without duplicates.
 */
const RUN = `vitest-svcprod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', program: '', category: '', plain: '', inCat: '', picked: '', offering: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

async function programItem() {
  const p = await prisma.serviceProgram.findUniqueOrThrow({ where: { id: ids.program } })
  const offerings = await prisma.serviceOffering.findMany({ where: { programId: ids.program } })
  return serializeProgram(p, offerings)
}

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ids.admin = (await prisma.user.create({ data: { name: 'Vitest admin', email: `${RUN}-admin@vitest.local`, roleId: admin.id, status: 'ACTIVE' } })).id
  session = { id: ids.admin, roleName: 'Admin' }
  ids.program = (await prisma.serviceProgram.create({ data: { slug: RUN, name: `Vitest Beauty ${RUN}`, tagline: 'x', description: 'test programme', keyServices: [] } })).id
  ids.plain = (await prisma.productCategory.create({ data: { name: `Vitest Plain ${RUN}` } })).id
  const mk = (title: string, categoryId: string, soldCount = 0) => prisma.product.create({
    data: { title, description: 'Test product for service pages.', priceRwf: 1000, images: [], categoryId, stockQty: 5, status: 'ACTIVE', soldCount, createdByName: 'Vitest' },
  }).then((p) => p.id)
  ids.picked = await mk(`Vitest Picked ${RUN}`, ids.plain)
}, 60_000)

afterAll(async () => {
  await prisma.serviceOffering.deleteMany({ where: { programId: ids.program } })
  await prisma.product.deleteMany({ where: { id: { in: [ids.inCat, ids.picked].filter(Boolean) } } })
  await prisma.productCategory.deleteMany({ where: { id: { in: [ids.category, ids.plain].filter(Boolean) } } })
  await prisma.serviceProgram.deleteMany({ where: { id: ids.program } })
  await prisma.user.deleteMany({ where: { id: ids.admin } })
}, 60_000)

describe('shop categories linked to services', () => {
  it('a category can be linked to an existing service (optional); an unknown service is refused', async () => {
    expect((await addCategory(req('/api/shop/categories', 'POST', { name: `Vitest Bad ${RUN}`, serviceProgramId: 'a'.repeat(24) }))).status).toBe(400)
    const res = await addCategory(req('/api/shop/categories', 'POST', { name: `Vitest Skin ${RUN}`, serviceProgramId: ids.program }))
    expect(res.status).toBe(201)
    const c = (await res.json()).data
    ids.category = c.id
    expect(c.serviceProgramId).toBe(ids.program)
  }, 60_000)

  it("the service's pages get the category's products, plus products picked on a sub-service, no duplicates", async () => {
    ids.inCat = (await prisma.product.create({ data: { title: `Vitest Cream ${RUN}`, description: 'Cream for the test.', priceRwf: 2000, images: [], categoryId: ids.category, stockQty: 3, status: 'ACTIVE', createdByName: 'Vitest' } })).id
    ids.offering = (await prisma.serviceOffering.create({ data: { programId: ids.program, slug: 'skin', name: 'Skin', summary: 'Skin', channels: ['MESSAGE'], productIds: [ids.picked, ids.inCat] } })).id

    const { products, categories } = await getProgramProducts(await programItem())
    expect(products.map((p) => p.id).sort()).toEqual([ids.inCat, ids.picked].sort())
    expect(categories).toEqual([{ id: ids.category, name: `Vitest Skin ${RUN}` }])
  }, 60_000)

  it('unlinking the category leaves only the hand-picked products', async () => {
    expect((await editCategory(req(`/api/shop/categories/${ids.category}`, 'PATCH', { serviceProgramId: null }), ctx(ids.category))).status).toBe(200)
    await prisma.serviceOffering.update({ where: { id: ids.offering }, data: { productIds: [ids.picked] } })
    const { products, categories } = await getProgramProducts(await programItem())
    expect(products.map((p) => p.id)).toEqual([ids.picked])
    expect(categories).toEqual([])
  }, 60_000)
})
