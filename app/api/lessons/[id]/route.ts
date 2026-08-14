import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

function serializeLesson(l: { id: string; courseId: string; title: string; contentType: string; durationMinutes: number; content: string; contentMarkdown: string | null; order: number }) {
  return {
    id: l.id,
    courseId: l.courseId,
    title: l.title,
    contentType: l.contentType,
    durationMinutes: l.durationMinutes,
    content: l.content,
    contentMarkdown: l.contentMarkdown ?? undefined,
    order: l.order,
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await prisma.lesson.findUnique({ where: { id } })
  if (!lesson) {
    return NextResponse.json({ data: null, message: 'Lesson not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeLesson(lesson), message: 'Lesson fetched successfully', code: 'success', status: 200 })
}

const updateLessonSchema = z.object({
  title: z.string().trim().min(1).optional(),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']).optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  content: z.string().optional(),
  contentMarkdown: z.string().nullable().optional(),
  order: z.number().int().optional(),
})

export const PATCH = withErrorHandling('/api/lessons/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = updateLessonSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.lesson.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Lesson not found', 404)

  const updated = await prisma.lesson.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ data: serializeLesson(updated), message: 'Lesson updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/lessons/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const existing = await prisma.lesson.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Lesson not found', 404)
  await prisma.lesson.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Lesson deleted successfully', code: 'success', status: 200 })
})
