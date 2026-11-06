import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as addProgram } from '../services/programs/route'
import { POST as addOffering } from '../services/programs/[id]/offerings/route'
import { PATCH as editOffering } from '../services/offerings/[id]/route'
import { POST as createRequest, GET as listRequests } from '../services/requests/route'
import { PATCH as updateRequest } from '../services/requests/[id]/route'

/**
 * Sub-services and service requests on the TEST database: admins add a
 * programme and its sub-services (ways to help + linked products); a member
 * asks for one or several by call / messages / meeting; staff schedule it;
 * either side cancels; each step notifies the other.
 */
const RUN = `vitest-srv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', member: '', other: '', program: '', talk: '', shop: '', request: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))

const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const as = (who: 'admin' | 'member' | 'other') => { session = { id: ids[who], roleName: who === 'admin' ? 'Admin' : 'Member' } }
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (tag: string, roleId: string) => prisma.user.create({ data: { name: `Vitest ${tag}`, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.admin, ids.member, ids.other] = await Promise.all([mk('admin', admin.id), mk('member', member.id), mk('other', member.id)])
}, 60_000)

afterAll(async () => {
  await prisma.serviceRequest.deleteMany({ where: { userId: { in: [ids.member, ids.other] } } })
  if (ids.program) {
    await prisma.serviceOffering.deleteMany({ where: { programId: ids.program } })
    await prisma.serviceProgram.deleteMany({ where: { id: ids.program } })
  }
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.admin, ids.member, ids.other] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.admin, ids.member, ids.other] } } })
}, 60_000)

describe('sub-services', () => {
  it('only admins add programmes and sub-services; each sub-service needs a way to help', async () => {
    as('member')
    expect((await addProgram(req('/api/services/programs', 'POST', { name: 'x' }))).status).toBe(403)

    as('admin')
    const p = await addProgram(req('/api/services/programs', 'POST', {
      name: `Vitest Care ${RUN}`, tagline: 'Talk to us.', description: 'A programme created by the test suite.', icon: 'messages', color: 'gold',
    }))
    expect(p.status).toBe(201)
    ids.program = (await p.json()).data.id

    expect((await addOffering(req(`/api/services/programs/${ids.program}/offerings`, 'POST', { name: 'Nothing', summary: 'x', channels: [], productIds: [] }), ctx(ids.program))).status).toBe(400)

    const a = await addOffering(req(`/api/services/programs/${ids.program}/offerings`, 'POST', { name: 'Family talk', summary: 'Talk about family life.', channels: ['CALL', 'MESSAGE', 'MEETING'], productIds: [] }), ctx(ids.program))
    expect(a.status).toBe(201)
    ids.talk = (await a.json()).data.id
    const b = await addOffering(req(`/api/services/programs/${ids.program}/offerings`, 'POST', { name: 'Skin advice', summary: 'Skin care tips.', channels: ['MESSAGE'], productIds: [] }), ctx(ids.program))
    ids.shop = (await b.json()).data.id
    // Same name twice in one programme is refused (same web address).
    expect((await addOffering(req(`/api/services/programs/${ids.program}/offerings`, 'POST', { name: 'Family talk', summary: 'again', channels: ['CALL'], productIds: [] }), ctx(ids.program))).status).toBe(409)
  }, 60_000)

  it('rejects the unsupported legacy colours for new saves but accepts the brand ones', async () => {
    as('admin')
    expect((await addProgram(req('/api/services/programs', 'POST', { name: `Vitest Blue ${RUN}`, tagline: 'x y', description: 'a description long enough', icon: 'leaf', color: 'blue' }))).status).toBe(400)
  }, 60_000)
})

describe('service requests', () => {
  it('a member asks for one or more sub-services; the way to talk must suit all of them', async () => {
    as('member')
    const base = { programId: ids.program, note: 'I would like some help, please.' }
    // Skin advice offers messages only.
    expect((await createRequest(req('/api/services/requests', 'POST', { ...base, offeringIds: [ids.talk, ids.shop], channel: 'CALL', phone: '0781234567' }))).status).toBe(400)
    // A call needs a phone number.
    expect((await createRequest(req('/api/services/requests', 'POST', { ...base, offeringIds: [ids.talk], channel: 'CALL' }))).status).toBe(400)

    const res = await createRequest(req('/api/services/requests', 'POST', { ...base, offeringIds: [ids.talk, ids.shop], channel: 'MESSAGE', preferredAt: inHours(24) }))
    expect(res.status).toBe(201)
    const r = (await res.json()).data
    ids.request = r.id
    expect(r).toMatchObject({ status: 'PENDING', channel: 'MESSAGE', offeringNames: ['Family talk', 'Skin advice'], programSlug: expect.any(String) })
    expect(r.number).toMatch(/^SRV-\d{6}-[A-Z0-9]{4}$/)

    const toAdmin = await prisma.notification.findFirst({ where: { recipientId: ids.admin, title: { contains: 'request' } } })
    expect(toAdmin?.message).toContain('Family talk')
  }, 60_000)

  it('members see only their own; staff see all', async () => {
    as('other')
    expect(((await (await listRequests(req('/api/services/requests', 'GET'))).json()).data as unknown[]).length).toBe(0)
    expect((await listRequests(req('/api/services/requests?all=1', 'GET'))).status).toBe(403)
    as('admin')
    const all = (await (await listRequests(req('/api/services/requests?all=1', 'GET'))).json()).data as { id: string }[]
    expect(all.map((x) => x.id)).toContain(ids.request)
  }, 60_000)

  it('staff schedule it and the member is told; another member cannot touch it', async () => {
    as('other')
    expect((await updateRequest(req(`/api/services/requests/${ids.request}`, 'PATCH', { action: 'cancel', reason: 'not mine' }), ctx(ids.request))).status).toBe(403)
    as('member')
    expect((await updateRequest(req(`/api/services/requests/${ids.request}`, 'PATCH', { action: 'schedule', scheduledAt: inHours(30) }), ctx(ids.request))).status).toBe(403)

    as('admin')
    const res = await updateRequest(req(`/api/services/requests/${ids.request}`, 'PATCH', { action: 'schedule', scheduledAt: inHours(30), staffNote: 'Talk soon' }), ctx(ids.request))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ status: 'SCHEDULED', staffNote: 'Talk soon', handledById: ids.admin })
    const n = await prisma.notification.findFirst({ where: { recipientId: ids.member, title: { contains: 'scheduled' } } })
    expect(n?.message).toContain('Messages')
  }, 60_000)

  it('the member cancels; it cannot be cancelled twice; a hidden sub-service cannot be requested', async () => {
    as('member')
    expect((await updateRequest(req(`/api/services/requests/${ids.request}`, 'PATCH', { action: 'cancel', reason: 'No longer needed' }), ctx(ids.request))).status).toBe(200)
    expect((await updateRequest(req(`/api/services/requests/${ids.request}`, 'PATCH', { action: 'cancel', reason: 'again' }), ctx(ids.request))).status).toBe(409)
    const toStaff = await prisma.notification.findFirst({ where: { recipientId: ids.admin, title: 'Request cancelled by the member' } })
    expect(toStaff?.message).toContain('No longer needed')

    as('admin')
    await editOffering(req(`/api/services/offerings/${ids.shop}`, 'PATCH', { active: false }), ctx(ids.shop))
    as('member')
    expect((await createRequest(req('/api/services/requests', 'POST', { programId: ids.program, offeringIds: [ids.shop], channel: 'MESSAGE', note: 'Skin help please' }))).status).toBe(409)
  }, 60_000)
})
