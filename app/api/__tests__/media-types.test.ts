import { describe, it, expect, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as listMediaTypes, POST as createMediaType } from '../media-types/route'
import { PATCH as updateMediaType, DELETE as deleteMediaType } from '../media-types/[id]/route'
import { POST as createResource } from '../resources/route'
import { mediaCapabilities, mediaTypeCodeFromName, mediaTypeName, type MediaTypeOption } from '@/lib/media-types-shared'

/**
 * Real integration tests against the configured database (same convention as
 * resource-views.test.ts) for the admin-managed media types: the list the
 * resource form reads, staff-only writes, and the guards that keep resources
 * pointing at a type that exists.
 */
const RUN_ID = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`
const NAME = `Vitest Type ${RUN_ID}`
let session: { id: string; roleName: string } | null = null
let createdId = ''
let createdCode = ''
let resourceId = ''

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))

const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `vitest-${RUN_ID}` },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const admin = { id: '000000000000000000000001', roleName: 'Admin' }

afterAll(async () => {
  if (resourceId) await prisma.resource.deleteMany({ where: { id: resourceId } })
  await prisma.resourceMediaType.deleteMany({ where: { name: { startsWith: 'Vitest Type' } } })
}, 60_000)

describe('media type helpers', () => {
  const types = [{ code: 'TEXT', name: 'Written', allowsChapters: true, allowsDocument: false, allowsAudio: false, allowsVideo: false }] as MediaTypeOption[]

  it('builds the stored code from the name', () => {
    expect(mediaTypeCodeFromName('Sermon notes (PDF)')).toBe('SERMON_NOTES_PDF')
    expect(mediaTypeCodeFromName('  !!  ')).toBe('')
  })

  it('resolves names and capabilities from the list, never from a hardcoded map', () => {
    expect(mediaTypeName('TEXT', types)).toBe('Written')
    expect(mediaTypeName('GONE', types)).toBe('GONE')
    expect(mediaCapabilities('TEXT', types).allowsChapters).toBe(true)
    expect(mediaCapabilities('GONE', types)).toEqual({ allowsChapters: false, allowsDocument: false, allowsAudio: false, allowsVideo: false })
  })
})

describe('/api/media-types', () => {
  it('lists the built-in types publicly', async () => {
    session = null
    const res = await listMediaTypes()
    expect(res.status).toBe(200)
    const codes = ((await res.json()).data as MediaTypeOption[]).filter((t) => t.isSystem).map((t) => t.code)
    expect(codes).toEqual(expect.arrayContaining(['TEXT', 'DOCUMENT', 'AUDIO', 'VIDEO', 'COMBINATION']))
  }, 60_000)

  it('only staff can add a type', async () => {
    session = null
    expect((await createMediaType(json('/api/media-types', 'POST', { name: NAME }))).status).toBe(401)
    session = { id: admin.id, roleName: 'Member' }
    expect((await createMediaType(json('/api/media-types', 'POST', { name: NAME }))).status).toBe(403)
  })

  it('adds a type, generates its code, and rejects a duplicate', async () => {
    session = admin
    const res = await createMediaType(json('/api/media-types', 'POST', { name: NAME, allowsAudio: true, allowsDocument: true }))
    expect(res.status).toBe(201)
    const created = (await res.json()).data as MediaTypeOption
    createdId = created.id
    createdCode = created.code
    expect(created.code).toBe(mediaTypeCodeFromName(NAME))
    expect(created).toMatchObject({ allowsAudio: true, allowsDocument: true, allowsChapters: false, allowsVideo: false, isSystem: false })

    expect((await createMediaType(json('/api/media-types', 'POST', { name: NAME }))).status).toBe(409)

    const list = (await (await listMediaTypes()).json()).data as MediaTypeOption[]
    expect(list.some((t) => t.code === createdCode)).toBe(true)
  }, 60_000)

  it('edits a custom type but keeps a built-in type\'s content fixed', async () => {
    session = admin
    const res = await updateMediaType(json(`/api/media-types/${createdId}`, 'PATCH', { description: 'For tests', allowsVideo: true }), ctx(createdId))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ description: 'For tests', allowsVideo: true, code: createdCode })

    const text = await prisma.resourceMediaType.findUniqueOrThrow({ where: { code: 'TEXT' } })
    expect((await updateMediaType(json(`/api/media-types/${text.id}`, 'PATCH', { allowsVideo: true }), ctx(text.id))).status).toBe(400)
    expect((await deleteMediaType(json(`/api/media-types/${text.id}`, 'DELETE'), ctx(text.id))).status).toBe(409)
  }, 60_000)

  it('a resource can use the new type, an unknown type is rejected, and a type in use cannot be deleted', async () => {
    session = admin
    const category = await prisma.category.findFirstOrThrow({ select: { id: true } })
    const base = {
      title: `Vitest Media Resource ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
      language: 'EN', year: 2026, pages: 10, price: 0, totalQty: 1, availableQty: 1, coverImages: [],
      bindingType: 'SOFT', description: 'Test', tags: [], categoryId: category.id,
    }

    const bad = await createResource(json('/api/resources', 'POST', { ...base, mediaType: `NOPE_${RUN_ID}` }))
    expect(bad.status).toBe(400)

    const ok = await createResource(json('/api/resources', 'POST', { ...base, mediaType: createdCode }))
    expect(ok.status).toBe(201)
    const resource = (await ok.json()).data
    resourceId = resource.id
    expect(resource.mediaType).toBe(createdCode)

    expect((await deleteMediaType(json(`/api/media-types/${createdId}`, 'DELETE'), ctx(createdId))).status).toBe(409)

    await prisma.resource.delete({ where: { id: resourceId } })
    resourceId = ''
    expect((await deleteMediaType(json(`/api/media-types/${createdId}`, 'DELETE'), ctx(createdId))).status).toBe(200)
  }, 60_000)
})
