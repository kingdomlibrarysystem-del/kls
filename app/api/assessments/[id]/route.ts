import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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
  const { id } = await params
  const assessment = await prisma.assessment.findUnique({ where: { id } })
  if (!assessment) {
    return NextResponse.json({ data: null, message: 'Assessment not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeAssessment(assessment), message: 'Assessment fetched successfully', code: 'success', status: 200 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.assessment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Assessment not found', code: 'error', status: 404 }, { status: 404 })
    }
    const data: Record<string, unknown> = { ...body }
    delete data.id
    delete data.courseId
    const updated = await prisma.assessment.update({ where: { id }, data })
    return NextResponse.json({ data: serializeAssessment(updated), message: 'Assessment updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update assessment', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.assessment.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Assessment not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.assessment.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Assessment deleted successfully', code: 'success', status: 200 })
}
