import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as addCounselor, GET as listCounselorsRoute } from '../counseling/counselors/route'
import { PATCH as editCounselor } from '../counseling/counselors/[id]/route'
import { POST as bookSession } from '../counseling/sessions/route'
import { PATCH as updateSession } from '../counseling/sessions/[id]/route'
import { POST as addResource, GET as listResources } from '../care/resources/route'
import { GET as openResourceRoute, DELETE as trashResource } from '../care/resources/[id]/route'
import { POST as joinGroup, DELETE as leaveGroup } from '../rehabilitation/groups/route'

/** Care & Support end to end on the TEST database: counselors, phone/video booking, staff confirmation, resources, support groups. */
const RUN = `vitest-care-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { staff: '', member: '', counselor: '', session: '', resource: '', group: '' }

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (session ? { user: session } : null)),
}))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const as = (who: 'staff' | 'member') => { session = { id: ids[who], roleName: who === 'staff' ? 'Admin' : 'Member' } }
const inHours = (h: number) => new Date(Date.now() + h * 3600 * 1000).toISOString()

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (tag: string, roleId: string) => prisma.user.create({ data: { name: `Vitest ${tag}`, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.staff, ids.member] = await Promise.all([mk('staff', admin.id), mk('member', member.id)])
  ids.group = (await prisma.supportGroup.create({ data: { name: `Vitest Group ${RUN}`, focus: 'Recovery', description: 'Weekly circle', meetingCadence: 'Weekly', image: '' } })).id
}, 60_000)

afterAll(async () => {
  await prisma.counselingSession.deleteMany({ where: { userId: ids.member } })
  if (ids.counselor) await prisma.counselor.deleteMany({ where: { id: ids.counselor } })
  if (ids.resource) await prisma.careResource.deleteMany({ where: { id: ids.resource } })
  await prisma.rehabGroupMember.deleteMany({ where: { groupId: ids.group } })
  await prisma.supportGroup.deleteMany({ where: { id: ids.group } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: [ids.staff, ids.member] } } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.staff, ids.member] } } })
}, 60_000)

describe('counselors and sessions', () => {
  it('only staff add counselors; a hidden counselor is not offered to members', async () => {
    as('member')
    expect((await addCounselor(req('/api/counseling/counselors', 'POST', { name: 'X Y', specialty: 'Grief' }))).status).toBe(403)
    as('staff')
    const res = await addCounselor(req('/api/counseling/counselors', 'POST', { name: `Vitest Counselor ${RUN}`, specialty: 'Family & marriage', userId: ids.staff, languages: ['Kinyarwanda', 'English'] }))
    expect(res.status).toBe(201)
    ids.counselor = (await res.json()).data.id

    const list = async () => ((await (await listCounselorsRoute(req('/api/counseling/counselors', 'GET'))).json()).data as { id: string }[]).map((c) => c.id)
    expect(await list()).toContain(ids.counselor)
    await editCounselor(req(`/api/counseling/counselors/${ids.counselor}`, 'PATCH', { active: false }), ctx(ids.counselor))
    expect(await list()).not.toContain(ids.counselor)
    await editCounselor(req(`/api/counseling/counselors/${ids.counselor}`, 'PATCH', { active: true }), ctx(ids.counselor))
  }, 60_000)

  it('a phone session needs a valid number and a future time', async () => {
    as('member')
    const base = { userId: ids.member, counselorId: ids.counselor, mode: 'PHONE', reason: 'I would like to talk about stress at home.' }
    expect((await bookSession(req('/api/counseling/sessions', 'POST', { ...base, proposedTime: inHours(24), contactPhone: '123' }))).status).toBe(400)
    expect((await bookSession(req('/api/counseling/sessions', 'POST', { ...base, proposedTime: inHours(-1), contactPhone: '0781234567' }))).status).toBe(400)
    const ok = await bookSession(req('/api/counseling/sessions', 'POST', { ...base, proposedTime: inHours(24), contactPhone: '078 123 4567' }))
    expect(ok.status).toBe(201)
    const s = (await ok.json()).data
    ids.session = s.id
    expect(s).toMatchObject({ status: 'PENDING', mode: 'PHONE', contactPhone: '0781234567', counselorUserId: ids.staff })
  }, 60_000)

  it('members cannot confirm; staff confirm with details and the member is notified', async () => {
    as('member')
    expect((await updateSession(req(`/api/counseling/sessions/${ids.session}`, 'PATCH', { status: 'CONFIRMED' }), ctx(ids.session))).status).toBe(403)
    as('staff')
    const res = await updateSession(req(`/api/counseling/sessions/${ids.session}`, 'PATCH', { status: 'CONFIRMED', note: 'Talk soon' }), ctx(ids.session))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ status: 'CONFIRMED', staffNote: 'Talk soon' })
    const n = await prisma.notification.findFirst({ where: { recipientId: ids.member, title: 'Counseling session confirmed' } })
    expect(n?.message).toContain('0781234567')

    as('member')
    expect((await updateSession(req(`/api/counseling/sessions/${ids.session}`, 'PATCH', { status: 'CANCELLED' }), ctx(ids.session))).status).toBe(200)
    expect((await updateSession(req(`/api/counseling/sessions/${ids.session}`, 'PATCH', { status: 'CANCELLED' }), ctx(ids.session))).status).toBe(409)
  }, 60_000)
})

describe('care resources and support groups', () => {
  it('staff publish a reading; members open it (view counted); Trash hides it', async () => {
    as('staff')
    expect((await addResource(req('/api/care/resources', 'POST', { program: 'COUNSELING', kind: 'AUDIO', title: 'Calm', summary: 'A short calming audio.', topic: 'Anxiety' }))).status).toBe(400) // audio needs a file
    const res = await addResource(req('/api/care/resources', 'POST', {
      program: 'COUNSELING', kind: 'ARTICLE', title: `Vitest Reading ${RUN}`, summary: 'Hope for anxious days.', topic: 'Anxiety',
      body: 'Cast all your anxiety on Him because He cares for you. A longer reflection follows here.',
    }))
    expect(res.status).toBe(201)
    ids.resource = (await res.json()).data.id

    session = null
    expect((await listResources(req('/api/care/resources', 'GET'))).status).toBe(401)
    as('member')
    const list = (await (await listResources(req('/api/care/resources?program=COUNSELING', 'GET'))).json()).data as { id: string; body: string | null }[]
    expect(list.find((r) => r.id === ids.resource)?.body).toBeNull() // lists don't carry the full text
    expect((await openResourceRoute(req(`/api/care/resources/${ids.resource}`, 'GET'), ctx(ids.resource))).status).toBe(200)
    expect((await prisma.careResource.findUniqueOrThrow({ where: { id: ids.resource } })).views).toBe(1)

    as('staff')
    await trashResource(req(`/api/care/resources/${ids.resource}`, 'DELETE'), ctx(ids.resource))
    as('member')
    expect((await openResourceRoute(req(`/api/care/resources/${ids.resource}`, 'GET'), ctx(ids.resource))).status).toBe(404)
  }, 60_000)

  it('a member joins and leaves a support group', async () => {
    as('member')
    expect((await joinGroup(req('/api/rehabilitation/groups', 'POST', { userId: ids.member, groupId: ids.group }))).status).toBe(201)
    expect((await joinGroup(req('/api/rehabilitation/groups', 'POST', { userId: ids.member, groupId: ids.group }))).status).toBe(409)
    expect((await leaveGroup(req(`/api/rehabilitation/groups?groupId=${ids.group}&userId=${ids.member}`, 'DELETE'))).status).toBe(200)
    expect(await prisma.rehabGroupMember.count({ where: { groupId: ids.group } })).toBe(0)
  }, 60_000)
})
