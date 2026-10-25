import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createResource, GET as listResources } from '../resources/route'
import { GET as getResource, PATCH as patchResource } from '../resources/[id]/route'
import { POST as reviewResource } from '../resources/[id]/review/route'
import { POST as addToCart } from '../cart/route'
import { isValidLibraryId } from '@/lib/klp-code'

/**
 * New library resources start as DRAFT (hidden from readers) and are
 * published by an approver, which assigns the KLP Code + Kingdom Library ID.
 * Runs on the TEST database only (prisma/client.tsx refuses anything else).
 */
const RUN = `vitest-klp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { staff: '', admin: '', member: '', category: '', pillar: '', draft: '', audio: '' }
const staffRole = `Vitest Librarian ${RUN}`

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const as = (who: 'staff' | 'admin' | 'member' | null) => {
  session = who ? { id: ids[who], roleName: who === 'admin' ? 'Admin' : who === 'member' ? 'Member' : staffRole } : null
}
const listIds = async (url: string) => ((await (await listResources(req(url, 'GET'))).json()).data as { id: string }[]).map((r) => r.id)

const book = (extra: Record<string, unknown> = {}) => ({
  title: `Vitest Covenant ${RUN}`,
  author: 'Vitest Author',
  categoryId: ids.category,
  mediaType: 'DOCUMENT',
  documentUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
  totalQty: 2,
  ...extra,
})

beforeAll(async () => {
  const [librarian, admin, member] = await Promise.all([
    prisma.role.create({ data: { name: staffRole, permissions: ['library:create'] } }),
    prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } }),
    prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } }),
  ])
  const mk = (tag: string, roleId: string) => prisma.user.create({ data: { name: `Vitest ${tag}`, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.staff, ids.admin, ids.member] = await Promise.all([mk('staff', librarian.id), mk('admin', admin.id), mk('member', member.id)])
  ids.pillar = (await prisma.category.create({ data: { slug: `${RUN}-p`, nameEn: `Vitest Pillar ${RUN}`, nameFr: 'P', nameRw: 'P' } })).id
  ids.category = (await prisma.category.create({ data: { slug: `${RUN}-s`, nameEn: 'Vitest Scroll', nameFr: 'S', nameRw: 'S', parentId: ids.pillar, status: 'AVAILABLE' } })).id
}, 60_000)

afterAll(async () => {
  const resourceIds = [ids.draft, ids.audio].filter(Boolean)
  await prisma.cartItem.deleteMany({ where: { resourceId: { in: resourceIds } } }).catch(() => {})
  await prisma.cart.deleteMany({ where: { userId: ids.member } }).catch(() => {})
  await prisma.resource.deleteMany({ where: { id: { in: resourceIds } } })
  await prisma.category.deleteMany({ where: { id: ids.category } })
  await prisma.category.deleteMany({ where: { id: ids.pillar } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.staff, ids.admin, ids.member] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.staff, ids.admin, ids.member] } } })
  await prisma.role.deleteMany({ where: { name: staffRole } })
}, 60_000)

describe('new resources wait for approval', () => {
  it('a new resource is saved as a hidden draft with no self-made ISBN', async () => {
    as('staff')
    const res = await createResource(req('/api/resources', 'POST', book({ officialIsbn: '' })))
    expect(res.status).toBe(201)
    const r = (await res.json()).data
    ids.draft = r.id
    expect(r).toMatchObject({ status: 'draft', klpCode: null, libraryId: null, officialIsbn: null })
    expect(r.isbn).toBe(`KL-${r.id}`) // internal key only

    // A bad official ISBN is refused rather than stored.
    expect((await createResource(req('/api/resources', 'POST', book({ title: `x ${RUN}`, officialIsbn: '978-0-306-40615-8' })))).status).toBe(400)
  }, 60_000)

  it('readers cannot see, open or buy a draft; staff can see it when asking for drafts', async () => {
    for (const who of [null, 'member'] as const) {
      as(who)
      expect(await listIds('/api/resources?pageSize=1000&includeDrafts=1')).not.toContain(ids.draft)
      expect((await getResource(req(`/api/resources/${ids.draft}`, 'GET'), ctx(ids.draft))).status).toBe(404)
    }
    as('member')
    expect((await addToCart(req('/api/cart', 'POST', { userId: ids.member, resourceId: ids.draft, type: 'RENTAL' }))).status).toBe(404)

    as('staff')
    expect(await listIds('/api/resources?pageSize=1000')).not.toContain(ids.draft) // only when asked
    expect(await listIds('/api/resources?pageSize=1000&includeDrafts=1')).toContain(ids.draft)
    expect((await getResource(req(`/api/resources/${ids.draft}`, 'GET'), ctx(ids.draft))).status).toBe(200)
  }, 60_000)

  it('a draft cannot be published by a status edit, nor approved without permission', async () => {
    as('staff')
    expect((await patchResource(req(`/api/resources/${ids.draft}`, 'PATCH', { status: 'available' }), ctx(ids.draft))).status).toBe(409)
    expect((await reviewResource(req(`/api/resources/${ids.draft}/review`, 'POST', { action: 'approve', klpCollection: '01' }), ctx(ids.draft))).status).toBe(403)
    as('admin')
    // Collection is part of the code, so approval asks for it.
    expect((await reviewResource(req(`/api/resources/${ids.draft}/review`, 'POST', { action: 'approve' }), ctx(ids.draft))).status).toBe(400)
  }, 60_000)

  it('sending back keeps it hidden and tells the author why', async () => {
    as('admin')
    const res = await reviewResource(req(`/api/resources/${ids.draft}/review`, 'POST', { action: 'reject', note: 'Please add a sharper cover.' }), ctx(ids.draft))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ status: 'draft', reviewNote: 'Please add a sharper cover.' })
    const n = await prisma.notification.findFirst({ where: { recipientId: ids.staff, title: 'Resource needs changes' } })
    expect(n?.message).toContain('sharper cover')
  }, 60_000)

  it('approval publishes it and assigns a KLP code and a valid Kingdom Library ID', async () => {
    as('admin')
    const res = await reviewResource(req(`/api/resources/${ids.draft}/review`, 'POST', { action: 'approve', klpCollection: '01' }), ctx(ids.draft))
    expect(res.status).toBe(200)
    const r = (await res.json()).data
    expect(r.status).toBe('available')
    expect(r.klpCode).toMatch(/^KLP-01-\d{2}-\d{3}-01-E$/) // uploaded document → E (eBook)
    expect(isValidLibraryId(r.libraryId)).toBe(true)
    expect(r.libraryId.slice(0, 4)).toBe('1001')
    expect(r.officialIsbn).toBeNull() // pending until the ISBN agency assigns one

    // Approving twice is refused, and the codes never change.
    expect((await reviewResource(req(`/api/resources/${ids.draft}/review`, 'POST', { action: 'approve', klpCollection: '01' }), ctx(ids.draft))).status).toBe(409)
    as('member')
    expect(await listIds('/api/resources?pageSize=1000')).toContain(ids.draft)
  }, 60_000)

  it('the audiobook of the same work shares its publication number and differs only in format', async () => {
    as('staff')
    const created = (await (await createResource(req('/api/resources', 'POST', book({ mediaType: 'AUDIO', documentUrl: undefined, audioUrl: 'https://res.cloudinary.com/demo/video/upload/a.mp3', klpCollection: '01' })))).json()).data
    ids.audio = created.id
    as('admin')
    const audio = (await (await reviewResource(req(`/api/resources/${ids.audio}/review`, 'POST', { action: 'approve' }), ctx(ids.audio))).json()).data
    const print = (await prisma.resource.findUniqueOrThrow({ where: { id: ids.draft } }))
    expect(audio.klpCode).toBe(print.klpCode!.replace(/-E$/, '-A'))
    expect(audio.libraryId.slice(0, 11)).toBe(print.libraryId!.slice(0, 11))
    expect(audio.libraryId[11]).toBe('3') // A → 3
  }, 60_000)
})
