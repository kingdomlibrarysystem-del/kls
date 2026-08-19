import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const assessment = await prisma.assessment.findUnique({ where: { id } })
  if (!assessment) {
    return NextResponse.json({ data: null, message: 'Assessment not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeAssessment(assessment), message: 'Assessment fetched successfully', code: 'success', status: 200 })
}

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1),
  type: z.string(),
  context: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctOptionIndex: z.number().int().optional(),
  correctOptionIndices: z.array(z.number().int()).optional(),
  marks: z.number(),
})

const updateAssessmentSchema = z.object({
  title: z.string().trim().min(1).optional(),
  kind: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  questions: z.array(questionSchema).optional(),
  brief: z.string().nullable().optional(),
  submissionFormat: z.string().nullable().optional(),
  projectMarks: z.number().nullable().optional(),
})

export const PATCH = withErrorHandling('/api/assessments/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateAssessmentSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.assessment.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Assessment not found', 404)

  const { questions, kind, submissionFormat, ...rest } = parsed.data
  const updated = await prisma.assessment.update({
    where: { id },
    data: {
      ...rest,
      ...(kind !== undefined && { kind: kind as 'QUIZ' | 'EXAM' | 'PROJECT' }),
      ...(submissionFormat !== undefined && { submissionFormat: submissionFormat as 'TEXT' | 'LINK' | 'FILE_REF' | null }),
      ...(questions !== undefined && {
        questions: questions.map((q, i) => ({
          id: q.id ?? `q${i + 1}`,
          text: q.text,
          type: q.type as 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN',
          context: q.context ?? null,
          options: q.options ?? [],
          correctOptionIndex: q.correctOptionIndex ?? null,
          correctOptionIndices: q.correctOptionIndices ?? [],
          marks: q.marks,
        })),
      }),
    },
  })
  return NextResponse.json({ data: serializeAssessment(updated), message: 'Assessment updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/assessments/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.assessment.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Assessment not found', 404)

  await prisma.assessment.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Assessment deleted successfully', code: 'success', status: 200 })
})
