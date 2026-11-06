import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createRequest } from '../session-requests/route'
import { GET as listPending, POST as issueCompleted } from '../certificates/issue-completed/route'
import { GET as certificatePdf } from '../certificates/[id]/pdf/route'

/**
 * Open classes (session requests) only after finishing a course, one open at
 * a time; admins issue certificates to everyone who completed a course; the
 * certificate PDF is for its owner and staff. TEST database only.
 */
const RUN = `vitest-oc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', member: '', other: '', course: '', done: '', notDone: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const as = (who: 'admin' | 'member' | 'other') => { session = { id: ids[who], roleName: who === 'admin' ? 'Admin' : 'Member' } }

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const mk = (tag: string, roleId: string) => prisma.user.create({ data: { name: `Vitest ${tag}`, email: `${RUN}-${tag}@vitest.local`, roleId, status: 'ACTIVE' } }).then((u) => u.id)
  ;[ids.admin, ids.member, ids.other] = await Promise.all([mk('admin', admin.id), mk('member', member.id), mk('other', member.id)])
  ids.done = (await prisma.course.create({ data: { title: `Vitest Done ${RUN}`, description: 'Test', category: 'Test', author: 'Test' } })).id
  ids.notDone = (await prisma.course.create({ data: { title: `Vitest Going ${RUN}`, description: 'Test', category: 'Test', author: 'Test' } })).id
  await prisma.enrollment.create({ data: { userId: ids.member, courseId: ids.done, status: 'COMPLETED', totalLessons: 1, completedLessonIds: [], assessmentPassed: false } })
  await prisma.enrollment.create({ data: { userId: ids.member, courseId: ids.notDone, status: 'ENROLLED', totalLessons: 3, completedLessonIds: [] } })
}, 60_000)

afterAll(async () => {
  const users = [ids.admin, ids.member, ids.other]
  await prisma.sessionRequest.deleteMany({ where: { learnerId: { in: users } } })
  await prisma.certificate.deleteMany({ where: { userId: { in: users } } })
  await prisma.enrollment.deleteMany({ where: { userId: { in: users } } })
  await prisma.course.deleteMany({ where: { id: { in: [ids.done, ids.notDone] } } })
  await prisma.notification.deleteMany({ where: { recipientId: { in: users } } })
  await prisma.user.deleteMany({ where: { id: { in: users } } })
}, 60_000)

describe('open class', () => {
  it('a member can ask only for a finished course, and only one open class at a time', async () => {
    as('member')
    const now = new Date().toISOString()
    expect((await createRequest(req('/api/session-requests', 'POST', { learnerId: ids.member, courseId: ids.notDone, proposedTime: now }))).status).toBe(403)
    expect((await createRequest(req('/api/session-requests', 'POST', { learnerId: ids.member, courseId: ids.done, proposedTime: now }))).status).toBe(201)
    expect((await createRequest(req('/api/session-requests', 'POST', { learnerId: ids.member, courseId: ids.done, proposedTime: now }))).status).toBe(409)
  }, 60_000)
})

describe('certificates for completed courses', () => {
  it('admins see who completed without a certificate and issue them all; members cannot', async () => {
    as('member')
    expect((await issueCompleted(req('/api/certificates/issue-completed', 'POST', {}))).status).toBe(403)

    as('admin')
    const pending = (await (await listPending()).json()).data as { userId: string; courseId: string; assessmentPassed: boolean }[]
    const mine = pending.filter((p) => p.userId === ids.member)
    expect(mine).toEqual([expect.objectContaining({ courseId: ids.done, assessmentPassed: false })]) // the unfinished course is not listed

    const res = await issueCompleted(req('/api/certificates/issue-completed', 'POST', {}))
    expect(res.status).toBe(200)
    const cert = await prisma.certificate.findFirstOrThrow({ where: { userId: ids.member, courseId: ids.done } })
    expect(cert.verificationCode).toMatch(/^KLS-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(await prisma.notification.count({ where: { recipientId: ids.member, title: 'Certificate issued' } })).toBe(1)

    // Running it again issues nothing new.
    await issueCompleted(req('/api/certificates/issue-completed', 'POST', {}))
    expect(await prisma.certificate.count({ where: { userId: ids.member, courseId: ids.done } })).toBe(1)
  }, 120_000)

  it('the PDF downloads for its owner, not for another member', async () => {
    const cert = await prisma.certificate.findFirstOrThrow({ where: { userId: ids.member } })
    const ctx = { params: Promise.resolve({ id: cert.id }) }
    as('other')
    expect((await certificatePdf(req(`/api/certificates/${cert.id}/pdf`, 'GET'), ctx)).status).toBe(403)
    as('member')
    const res = await certificatePdf(req(`/api/certificates/${cert.id}/pdf`, 'GET'), { params: Promise.resolve({ id: cert.id }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('content-disposition')).toContain('attachment')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  }, 60_000)
})
