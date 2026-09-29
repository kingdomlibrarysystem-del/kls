import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeAssessment(a: {
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

/** One assessment in the GET /api/assessments/[id] shape. */
export async function getAssessmentDetail(id: string) {
  if (!isObjectId(id)) return null
  const assessment = await prisma.assessment.findUnique({ where: { id } })
  return assessment ? serializeAssessment(assessment) : null
}
