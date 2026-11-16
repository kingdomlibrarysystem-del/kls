import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/prisma/client'
import { POST as createAssessment } from '../assessments/route'
import { PATCH as patchAssessment } from '../assessments/[id]/route'

/**
 * A course can have a final exam AND a project; a project is an uploaded
 * document (PDF, Word, PowerPoint…), not typed text. TEST database only.
 */
const RUN = `vitest-project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
let session: { id: string; roleName: string } | null = null
const ids = { admin: '', course: '', project: '' }
const DOC = 'https://res.cloudinary.com/demo/raw/upload/v1/kcs-resources/office/project-brief.docx'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => (session ? { user: session } : null)) }))
const req = (url: string, method: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const create = (body: unknown) => createAssessment(req('/api/assessments', 'POST', body))

beforeAll(async () => {
  const admin = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', permissions: [] } })
  ids.admin = (await prisma.user.create({ data: { name: 'Vitest Admin', email: `${RUN}@vitest.local`, roleId: admin.id, status: 'ACTIVE' } })).id
  session = { id: ids.admin, roleName: 'Admin' }
  ids.course = (await prisma.course.create({ data: { title: `Vitest Project Course ${RUN}`, description: 'Test', category: 'Test', author: 'Test' } })).id
}, 60_000)

afterAll(async () => {
  await prisma.assessment.deleteMany({ where: { courseId: ids.course } })
  await prisma.course.deleteMany({ where: { id: ids.course } })
  await prisma.user.deleteMany({ where: { id: ids.admin } })
}, 60_000)

describe('projects are documents, alongside the exam', () => {
  it('a course with an exam can also get a project with its document', async () => {
    const exam = await create({
      title: 'Final exam', kind: 'EXAM', courseId: ids.course, durationSeconds: 600,
      questions: [{ text: '1 + 1?', type: 'SINGLE_SELECT', options: ['1', '2'], correctOptionIndex: 1, marks: 1 }],
    })
    expect(exam.status).toBe(201)

    const res = await create({ title: 'Final project', kind: 'PROJECT', courseId: ids.course, briefFileUrl: DOC, briefFileName: 'project-brief.docx', submissionFormat: 'FILE_REF', projectMarks: 20 })
    expect(res.status).toBe(201)
    const project = (await res.json()).data
    ids.project = project.id
    expect(project.briefFileUrl).toBe(DOC)
    expect(project.briefFileName).toBe('project-brief.docx')
    expect(await prisma.assessment.count({ where: { courseId: ids.course } })).toBe(2)
  }, 60_000)

  it('a project without its document is refused', async () => {
    const res = await create({ title: 'No document', kind: 'PROJECT', courseId: ids.course, brief: 'Typed text only', submissionFormat: 'TEXT', projectMarks: 10 })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toContain('project document')
  }, 60_000)

  it('the document can be replaced, but not removed', async () => {
    const other = DOC.replace('project-brief.docx', 'project-v2.pdf')
    const ok = await patchAssessment(req(`/api/assessments/${ids.project}`, 'PATCH', { briefFileUrl: other, briefFileName: 'project-v2.pdf' }), { params: Promise.resolve({ id: ids.project }) })
    expect(ok.status).toBe(200)
    expect((await ok.json()).data.briefFileUrl).toBe(other)

    const removed = await patchAssessment(req(`/api/assessments/${ids.project}`, 'PATCH', { briefFileUrl: null }), { params: Promise.resolve({ id: ids.project }) })
    expect(removed.status).toBe(400)
  }, 60_000)
})
