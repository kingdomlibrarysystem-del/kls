import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { GET as listLessons } from '../lessons/route'
import { POST as enroll } from '../enrollments/route'
import { PATCH as patchEnrollment } from '../enrollments/[id]/route'
import { POST as submitAttempt } from '../assessment-attempts/route'
import { settleCourseOrder } from '../course-orders/settle'
import { lessonIsOpen } from '@/lib/course-access'

/**
 * Admin-controlled paid learning (lib/course-access.ts), end to end on the
 * TEST database: a paid course with a FREE lesson, an included lesson, a
 * lesson sold alone, a lesson quiz and an exam; then a free course with one
 * paid lesson. Payments are settled directly (no real provider call).
 */
const RUN = `vitest-pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { member: '', paidCourse: '', freeCourse: '', free: '', included: '', sold: '', freeCourseLesson: '', freeCoursePaid: '', quiz: '', exam: '', enrollment: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
const lessonsOf = async (courseId: string) => (await (await listLessons(req(`/api/lessons?courseId=${courseId}`, 'GET'))).json()).data as { id: string; locked?: boolean; contentMarkdown?: string }[]
const complete = (lessonId: string) => patchEnrollment(req(`/api/enrollments/${ids.enrollment}`, 'PATCH', { action: 'completeLesson', lessonId }), { params: Promise.resolve({ id: ids.enrollment }) })
const attempt = (assessmentId: string) => submitAttempt(req('/api/assessment-attempts', 'POST', { userId: ids.member, assessmentId, answers: { q1: 1 } }))
const paidOrder = async (lessonId?: string) => {
  const order = await prisma.courseOrder.create({
    data: { userId: ids.member, buyerName: 'Vitest', buyerEmail: `${RUN}@vitest.local`, buyerPhone: '0780000000', courseId: ids.paidCourse, courseTitle: 'Paid', method: 'PAYPACK', amountRwf: lessonId ? 300 : 1000, status: 'PENDING', ...(lessonId && { lessonId, lessonTitle: 'Sold alone' }) },
  })
  await settleCourseOrder(order.id, { providerStatus: 'successful' })
}

beforeAll(async () => {
  const role = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  ids.member = (await prisma.user.create({ data: { name: 'Vitest Payer', email: `${RUN}@vitest.local`, roleId: role.id, status: 'ACTIVE' } })).id
  session = { id: ids.member, roleName: 'Member' }

  ids.paidCourse = (await prisma.course.create({ data: { title: `Vitest Paid Course ${RUN}`, description: 'Test', category: 'Test', author: 'Test', status: 'PUBLISHED', price: 1000 } })).id
  const lesson = (courseId: string, n: number, access: 'COURSE' | 'FREE' | 'PAID', price = 0) =>
    prisma.lesson.create({ data: { courseId, title: `Lesson ${n}`, contentType: 'TEXT', durationMinutes: 5, content: 'Body', contentMarkdown: `Secret ${n}`, order: n, access, price } }).then((l) => l.id)
  ids.free = await lesson(ids.paidCourse, 1, 'FREE')
  ids.included = await lesson(ids.paidCourse, 2, 'COURSE')
  ids.sold = await lesson(ids.paidCourse, 3, 'PAID', 300)
  const q = [{ id: 'q1', text: '1 + 1?', type: 'SINGLE_SELECT' as const, options: ['1', '2'], correctOptionIndex: 1, correctOptionIndices: [], matchingPairs: [], marks: 1 }]
  ids.quiz = (await prisma.assessment.create({ data: { title: 'Lesson 2 quiz', kind: 'QUIZ', courseId: ids.paidCourse, lessonId: ids.included, questions: q } })).id
  ids.exam = (await prisma.assessment.create({ data: { title: 'Final exam', kind: 'EXAM', courseId: ids.paidCourse, questions: q } })).id

  ids.freeCourse = (await prisma.course.create({ data: { title: `Vitest Free Course ${RUN}`, description: 'Test', category: 'Test', author: 'Test', status: 'PUBLISHED', price: 0 } })).id
  ids.freeCourseLesson = await lesson(ids.freeCourse, 1, 'COURSE')
  ids.freeCoursePaid = await lesson(ids.freeCourse, 2, 'PAID', 500)
}, 60_000)

afterAll(async () => {
  const courseIds = [ids.paidCourse, ids.freeCourse]
  await prisma.assessmentAttempt.deleteMany({ where: { userId: ids.member } })
  await prisma.assessment.deleteMany({ where: { courseId: { in: courseIds } } })
  await prisma.courseOrder.deleteMany({ where: { userId: ids.member } })
  await prisma.certificate.deleteMany({ where: { userId: ids.member } })
  await prisma.notification.deleteMany({ where: { recipientId: ids.member } })
  await prisma.enrollment.deleteMany({ where: { userId: ids.member } })
  await prisma.lesson.deleteMany({ where: { courseId: { in: courseIds } } })
  await prisma.course.deleteMany({ where: { id: { in: courseIds } } })
  await prisma.user.deleteMany({ where: { id: ids.member } })
}, 60_000)

describe('the access rules', () => {
  it('match what the admin chose for each lesson', () => {
    expect(lessonIsOpen({ id: 'a', access: 'FREE' }, 1000)).toBe(true)
    expect(lessonIsOpen({ id: 'a', access: 'COURSE' }, 1000, { paid: false })).toBe(false)
    expect(lessonIsOpen({ id: 'a', access: 'COURSE' }, 1000, { paid: true })).toBe(true)
    expect(lessonIsOpen({ id: 'a', access: 'PAID', price: 300 }, 1000, { paid: false, unlockedLessonIds: ['a'] })).toBe(true)
    expect(lessonIsOpen({ id: 'a', access: 'COURSE' }, 0)).toBe(true)
    expect(lessonIsOpen({ id: 'a', access: 'PAID', price: 500 }, 0, { paid: true })).toBe(false)
    expect(lessonIsOpen({ id: 'a', access: 'COURSE' }, 1000, { paid: true, status: 'DROPPED' })).toBe(false)
  })
})

describe('a paid course', () => {
  it('can be joined for free: only the free lesson opens', async () => {
    const res = await enroll(req('/api/enrollments', 'POST', { userId: ids.member, courseId: ids.paidCourse }))
    expect(res.status).toBe(201)
    const data = (await res.json()).data
    ids.enrollment = data.id
    expect(data.paid).toBe(false)

    const lessons = await lessonsOf(ids.paidCourse)
    const byId = Object.fromEntries(lessons.map((l) => [l.id, l]))
    expect(byId[ids.free].locked).toBeUndefined()
    expect(byId[ids.free].contentMarkdown).toBe('Secret 1')
    expect(byId[ids.included].locked).toBe(true)
    expect(byId[ids.included].contentMarkdown).toBeUndefined() // no content sent
    expect(byId[ids.sold].locked).toBe(true)
  }, 60_000)

  it('refuses completing a locked lesson and taking its quiz or the exam', async () => {
    expect((await complete(ids.free)).status).toBe(200)
    expect((await complete(ids.included)).status).toBe(403)
    expect((await attempt(ids.quiz)).status).toBe(403)
    expect((await attempt(ids.exam)).status).toBe(403)
  }, 60_000)

  it('buying one lesson opens only that lesson', async () => {
    await paidOrder(ids.sold)
    const e = await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })
    expect(e.unlockedLessonIds).toContain(ids.sold)
    expect(e.paid).toBe(false)
    const byId = Object.fromEntries((await lessonsOf(ids.paidCourse)).map((l) => [l.id, l]))
    expect(byId[ids.sold].locked).toBeUndefined()
    expect(byId[ids.included].locked).toBe(true)
  }, 60_000)

  it('paying the course opens everything, including the quiz and the exam', async () => {
    await paidOrder()
    expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: ids.enrollment } })).paid).toBe(true)
    expect((await lessonsOf(ids.paidCourse)).every((l) => !l.locked)).toBe(true)
    expect((await complete(ids.included)).status).toBe(200)
    expect((await attempt(ids.quiz)).status).toBe(201)
    expect((await attempt(ids.exam)).status).toBe(201)
  }, 60_000)
})

describe('a free course with one paid lesson', () => {
  it('opens its lessons to everyone except the paid one', async () => {
    session = null // a visitor
    const byId = Object.fromEntries((await lessonsOf(ids.freeCourse)).map((l) => [l.id, l]))
    expect(byId[ids.freeCourseLesson].locked).toBeUndefined()
    expect(byId[ids.freeCoursePaid].locked).toBe(true)
    session = { id: ids.member, roleName: 'Member' }
  }, 60_000)
})
