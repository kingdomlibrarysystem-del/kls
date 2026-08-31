import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase()

  const categories = await prisma.courseCategory.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    data: categories.map(serializeCategory),
    message: 'Course categories fetched successfully',
    code: 'success',
    status: 200,
  })
}

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().optional(),
})

export const POST = withErrorHandling('/api/course-categories', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createCategorySchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.courseCategory.findUnique({ where: { name: body.name } })
  if (existing) {
    throw new ApiError(`A category named "${body.name}" already exists`, 409)
  }

  const category = await prisma.courseCategory.create({
    data: {
      name: body.name,
      description: body.description ?? null,
    },
  })

  return NextResponse.json({ data: serializeCategory(category), message: 'Course category created successfully', code: 'success', status: 201 }, { status: 201 })
})
