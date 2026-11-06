import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as submitAttempt } from '../assessment-attempts/route'
import { POST as createAssessment } from '../assessments/route'

/**
 * Lesson quizzes belong to one lesson, and a quiz / exam can be done only
 * once (no second try for better marks). Runs on the TEST database only.
 */
const RUN = `vitest-onetry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { member: '', admin: '', course: '', lesson: '', quiz: '' }

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

beforeAll(async () => {
  const member = await prisma.role.upsert({ where: { name: 'Member' }, update: {}, create: { name: 'Member', permissions: [] } })
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ids.member = (await prisma.user.create({ data: { name: 'Vitest Learner', email: `${RUN}@vitest.local`, roleId: member.id, status: 'ACTIVE' } })).id
  ids.admin = (await prisma.user.create({ data: { name: 'Vitest Admin', email: `${RUN}-admin@vitest.local`, roleId: admin.id, status: 'ACTIVE' } })).id
  ids.course = (await prisma.course.create({ data: { title: `Vitest Quiz Course ${RUN}`, description: 'Test', category: 'Test', author: 'Test' } })).id
  ids.lesson = (await prisma.lesson.create({ data: { courseId: ids.course, title: 'Lesson 1', contentType: 'TEXT', durationMinutes: 5, content: 'Read.', order: 1 } })).id
}, 60_000)

afterAll(async () => {
  await prisma.assessmentAttempt.deleteMany({ where: { userId: ids.member } })
  await prisma.assessment.deleteMany({ where: { courseId: ids.course } })
  await prisma.lesson.deleteMany({ where: { courseId: ids.course } })
  await prisma.course.deleteMany({ where: { id: ids.course } })
  await prisma.user.deleteMany({ where: { id: { in: [ids.member, ids.admin] } } })
}, 60_000)

describe('lesson quiz: its own lesson, one try only', () => {
  it('a quiz keeps the lesson it was made for', async () => {
    session = { id: ids.admin, roleName: 'Admin' }
    const res = await createAssessment(req('/api/assessments', {
      title: 'Lesson 1 quiz', kind: 'QUIZ', courseId: ids.course, lessonId: ids.lesson,
      questions: [{ text: '1 + 1?', type: 'SINGLE_SELECT', options: ['1', '2'], correctOptionIndex: 1, marks: 2 }],
    }))
    expect(res.status).toBe(201)
    const quiz = (await res.json()).data
    ids.quiz = quiz.id
    expect(quiz.lessonId).toBe(ids.lesson)
  }, 60_000)

  it('the first try is marked; a second try is refused with the marks', async () => {
    session = { id: ids.member, roleName: 'Member' }
    const first = await submitAttempt(req('/api/assessment-attempts', { userId: ids.member, assessmentId: ids.quiz, answers: { q1: 1 } }))
    expect(first.status).toBe(201)
    expect((await first.json()).data.score).toBe(2)

    const second = await submitAttempt(req('/api/assessment-attempts', { userId: ids.member, assessmentId: ids.quiz, answers: { q1: 0 } }))
    expect(second.status).toBe(409)
    expect((await second.json()).message).toContain('2 / 2')
    expect(await prisma.assessmentAttempt.count({ where: { userId: ids.member } })).toBe(1)
  }, 60_000)
})
