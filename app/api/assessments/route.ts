import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Assessment API, replacing app/member/_shared/assessment-data.ts's
 * Record<id, TakeableAssessment> — already a single store shared by the
 * admin Quizzes & Exams page and the member take-flow. Questions stay
 * embedded (Prisma Mongo `type Question`), matching the mock's own
 * always-fetched-together shape.
 */
function serializeAssessment(a: {
  id: string
  title: string
  kind: string
  courseId: string
  durationSeconds: number | null
  questions: { id: string; text: string; type: string; context: string | null; options: string[]; correctOptionIndex: number | null; correctOptionIndices: number[]; marks: number }[]
  brief: string | null
  submissionFormat: string | null
  projectMarks: number | null
}) {
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    courseId: a.courseId,
    durationSeconds: a.durationSeconds ?? undefined,
    questions: a.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      context: q.context ?? undefined,
      options: q.options.length ? q.options : undefined,
      correctOptionIndex: q.correctOptionIndex ?? undefined,
      correctOptionIndices: q.correctOptionIndices.length ? q.correctOptionIndices : undefined,
      marks: q.marks,
    })),
    brief: a.brief ?? undefined,
    submissionFormat: a.submissionFormat ?? undefined,
    projectMarks: a.projectMarks ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const courseId = searchParams.get('courseId')

  const where = { ...(courseId && { courseId }) }

  const [totalItems, assessments] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: assessments.map(serializeAssessment),
    message: 'Assessments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.title || !body.kind || !body.courseId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: title, kind, courseId', code: 'error', status: 400 }, { status: 400 })
    }
    const course = await prisma.course.findUnique({ where: { id: body.courseId } })
    if (!course) {
      return NextResponse.json({ data: null, message: 'The specified course does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    const assessment = await prisma.assessment.create({
      data: {
        title: body.title,
        kind: body.kind,
        courseId: body.courseId,
        durationSeconds: body.durationSeconds ?? null,
        questions: (body.questions ?? []).map((q: { id?: string; text: string; type: string; context?: string; options?: string[]; correctOptionIndex?: number; correctOptionIndices?: number[]; marks: number }, i: number) => ({
          id: q.id ?? `q${i + 1}`,
          text: q.text,
          type: q.type,
          context: q.context ?? null,
          options: q.options ?? [],
          correctOptionIndex: q.correctOptionIndex ?? null,
          correctOptionIndices: q.correctOptionIndices ?? [],
          marks: q.marks,
        })),
        brief: body.brief ?? null,
        submissionFormat: body.submissionFormat ?? null,
        projectMarks: body.projectMarks ?? null,
      },
    })
    return NextResponse.json({ data: serializeAssessment(assessment), message: 'Assessment created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create assessment', code: 'error', status: 500 }, { status: 500 })
  }
}
