import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

interface RouteParams {
  params: Promise<{ id: string }>
}

function serializeCategory(c: {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const category = await prisma.courseCategory.findUnique({ where: { id } })
  if (!category) {
    return NextResponse.json({ data: null, message: 'Course category not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: serializeCategory(category), message: 'Course category fetched successfully', code: 'success', status: 200 })
}

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
})

export const PATCH = withErrorHandling('/api/course-categories/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateCategorySchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.courseCategory.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Course category not found', 404)

  if (body.name && body.name !== existing.name) {
    const nameTaken = await prisma.courseCategory.findUnique({ where: { name: body.name } })
    if (nameTaken) throw new ApiError(`A category named "${body.name}" already exists`, 409)
  }

  const category = await prisma.courseCategory.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
    },
  })

  return NextResponse.json({ data: serializeCategory(category), message: 'Course category updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/course-categories/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params

  const existing = await prisma.courseCategory.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Course category not found', 404)

  const courseCount = await prisma.course.count({ where: { category: existing.name } })
  if (courseCount > 0) {
    throw new ApiError(`Cannot delete — ${courseCount} course(s) still use this category. Reassign or remove them first.`, 409)
  }

  await prisma.courseCategory.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Course category deleted successfully', code: 'success', status: 200 })
})
