import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createResource } from '../resources/route'

/**
 * A double click (or a slow network re-sending the form) must not create the
 * same book twice; a different edition (audio of a text book) still can.
 * TEST database only.
 */
const RUN = `vitest-dup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', pillar: '', category: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const post = (body: unknown) =>
  createResource(new NextRequest('http://localhost/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
const book = (extra: Record<string, unknown> = {}) => ({
  title: `Vitest Double ${RUN}`, author: 'Vitest Author', categoryId: ids.category, mediaType: 'DOCUMENT',
  documentUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf', totalQty: 1, ...extra,
})

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ids.admin = (await prisma.user.create({ data: { name: 'Vitest Admin', email: `${RUN}@vitest.local`, roleId: admin.id, status: 'ACTIVE' } })).id
  session = { id: ids.admin, roleName: 'Admin' }
  ids.pillar = (await prisma.category.create({ data: { slug: `${RUN}-p`, nameEn: `Vitest Pillar ${RUN}`, nameFr: 'P', nameRw: 'P' } })).id
  ids.category = (await prisma.category.create({ data: { slug: `${RUN}-s`, nameEn: 'Vitest Scroll', nameFr: 'S', nameRw: 'S', parentId: ids.pillar, status: 'AVAILABLE' } })).id
}, 60_000)

afterAll(async () => {
  await prisma.resource.deleteMany({ where: { createdById: ids.admin } })
  await prisma.notification.deleteMany({ where: { recipientId: ids.admin } })
  // The child section first: its parent cannot be deleted while it still points at it.
  await prisma.category.deleteMany({ where: { id: ids.category } })
  await prisma.category.deleteMany({ where: { id: ids.pillar } })
  await prisma.user.deleteMany({ where: { id: ids.admin } })
}, 60_000)

describe('adding a book', () => {
  it('the same book sent twice right away is saved once', async () => {
    expect((await post(book())).status).toBe(201)
    const again = await post(book())
    expect(again.status).toBe(409)
    expect((await again.json()).message).toContain('just added')
    expect(await prisma.resource.count({ where: { createdById: ids.admin } })).toBe(1)
  }, 60_000)

  it('another edition of the same book (audio) can still be added', async () => {
    const audio = await post(book({ mediaType: 'AUDIO', documentUrl: undefined, audioUrl: 'https://res.cloudinary.com/demo/video/upload/a.mp3' }))
    expect(audio.status).toBe(201)
  }, 60_000)
})
