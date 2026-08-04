import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeLesson(l: { id: string; courseId: string; title: string; contentType: string; durationMinutes: number; content: string; order: number }) {
  return {
    id: l.id,
    courseId: l.courseId,
    title: l.title,
    contentType: l.contentType,
    durationMinutes: l.durationMinutes,
    content: l.content,
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.lesson.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Lesson not found', code: 'error', status: 404 }, { status: 404 })
    }
    const data: Record<string, unknown> = { ...body }
    delete data.id
    delete data.courseId
    const updated = await prisma.lesson.update({ where: { id }, data })
    return NextResponse.json({ data: serializeLesson(updated), message: 'Lesson updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update lesson', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.lesson.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Lesson not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.lesson.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Lesson deleted successfully', code: 'success', status: 200 })
}
