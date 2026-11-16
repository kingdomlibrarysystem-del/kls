import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeLesson } from '@/lib/data/lessons'
import { getViewer, loadAccess } from '@/lib/data/course-access'
import { LESSON_ACCESS, lessonIsOpen } from '@/lib/course-access'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await prisma.lesson.findUnique({ where: { id } })
  if (!lesson) {
    return NextResponse.json({ data: null, message: 'Lesson not found', code: 'error', status: 404 }, { status: 404 })
  }
  const viewer = await getViewer()
  const access = viewer.staff ? null : await loadAccess(viewer.userId, [lesson.courseId])
  const locked = !!access && !lessonIsOpen(lesson, access.priceOf(lesson.courseId), access.enrollmentOf(lesson.courseId))
  return NextResponse.json({ data: serializeLesson(lesson, locked), message: 'Lesson fetched successfully', code: 'success', status: 200 })
}

const updateLessonSchema = z.object({
  title: z.string().trim().min(1).optional(),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']).optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  content: z.string().optional(),
  contentMarkdown: z.string().nullable().optional(),
  order: z.number().int().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  access: z.enum(LESSON_ACCESS as [string, ...string[]]).optional(),
  price: z.number().min(0).optional(),
})

export const PATCH = withErrorHandling('/api/lessons/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateLessonSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.lesson.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Lesson not found', 404)

  const { access, price, ...rest } = parsed.data
  const nextAccess = access ?? existing.access ?? 'COURSE'
  const nextPrice = price ?? existing.price ?? 0
  if (nextAccess === 'PAID' && !(nextPrice > 0)) throw new ApiError('Set a price for a paid lesson', 400)
  const updated = await prisma.lesson.update({
    where: { id },
    data: { ...rest, access: nextAccess as 'COURSE' | 'FREE' | 'PAID', price: nextAccess === 'PAID' ? nextPrice : 0 },
  })
  return NextResponse.json({ data: serializeLesson(updated), message: 'Lesson updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/lessons/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.lesson.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Lesson not found', 404)
  await prisma.lesson.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Lesson deleted successfully', code: 'success', status: 200 })
})
