import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as enroll } from '../enrollments/route'
import { PATCH as patchEnrollment } from '../enrollments/[id]/route'

/**
 * How a member gets a certificate, end to end on the TEST database: finishing
 * every current lesson completes the course; a course without a final exam
 * issues the certificate right away; leaving and re-joining a course keeps the
 * progress (it used to fail with "already enrolled").
 */
const RUN = `vitest-cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { member: '', course: '', l1: '', l2: '', enrollment: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const patch = (body: unknown) => patchEnrollment(req(`/api/enrollments/${ids.enrollment}`, 'PATCH', body), { params: Promise.resolve({ id: ids.enrollment }) })

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  ids.member = (await prisma.user.create({ data: { name: 'Vitest Learner', email: `${RUN}@vitest.local`, roleId: role.id, status: 'ACTIVE' } })).id
  session = { id: ids.member, roleName: 'Member' }
  ids.course = (await prisma.course.create({ data: { title: `Vitest No-Exam Course ${RUN}`, description: 'Test', category: 'Test', author: 'Test' } })).id
  const lesson = (n: number) => prisma.lesson.create({ data: { courseId: ids.course, title: `Lesson ${n}`, contentType: 'TEXT', durationMinutes: 5, content: 'Read this.', order: n } }).then((l) => l.id)
  ids.l1 = await lesson(1)
}, 60_000)

afterAll(async () => {
  await prisma.certificate.deleteMany({ where: { userId: ids.member } })
  await prisma.notification.deleteMany({ where: { recipientId: ids.member } })
  await prisma.enrollment.deleteMany({ where: { userId: ids.member } })
  await prisma.lesson.deleteMany({ where: { courseId: ids.course } })
  await prisma.course.deleteMany({ where: { id: ids.course } })
  await prisma.user.deleteMany({ where: { id: ids.member } })
}, 60_000)

describe('finishing a course gives a certificate', () => {
  it('counts the lessons the course has now, not when the member enrolled', async () => {
    const res = await enroll(req('/api/enrollments', 'POST', { userId: ids.member, courseId: ids.course }))
    expect(res.status).toBe(201)
    ids.enrollment = (await res.json()).data.id
    // A lesson is added after enrolling.
    ids.l2 = (await prisma.lesson.create({ data: { courseId: ids.course, title: 'Lesson 2', contentType: 'TEXT', durationMinutes: 5, content: 'More.', order: 2 } })).id

    await patch({ action: 'completeLesson', lessonId: ids.l1 })
    expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })).status).toBe('ENROLLED') // 1 of 2 — not finished
    expect(await prisma.certificate.count({ where: { userId: ids.member } })).toBe(0)
  }, 60_000)

  it('a course with no final exam issues the certificate as soon as every lesson is done', async () => {
    await patch({ action: 'completeLesson', lessonId: ids.l2 })
    const e = await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })
    expect(e.status).toBe('COMPLETED')
    const cert = await prisma.certificate.findFirst({ where: { userId: ids.member, courseId: ids.course } })
    expect(cert?.verificationCode).toMatch(/^KLS-/)
    expect(await prisma.notification.count({ where: { recipientId: ids.member, title: 'Certificate issued' } })).toBe(1)
  }, 60_000)

  it('leaving and joining again keeps the progress instead of failing', async () => {
    await patch({ action: 'unenroll' })
    expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })).status).toBe('DROPPED')
    const res = await enroll(req('/api/enrollments', 'POST', { userId: ids.member, courseId: ids.course }))
    expect(res.status).toBe(200)
    expect((await res.json()).data.id).toBe(ids.enrollment)
    expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })).status).toBe('COMPLETED')
    expect(await prisma.certificate.count({ where: { userId: ids.member } })).toBe(1) // not issued twice
    // Joining while already enrolled is still refused.
    expect((await enroll(req('/api/enrollments', 'POST', { userId: ids.member, courseId: ids.course }))).status).toBe(409)
  }, 60_000)
})
