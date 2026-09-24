import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

export async function GET() {
  const categories = await prisma.newsArticleCategory.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ data: categories, message: 'Categories fetched successfully', code: 'success', status: 200 })
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex like #3b82f6').optional(),
})

export const POST = withErrorHandling('/api/news/categories', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.newsArticleCategory.findUnique({ where: { name: parsed.data.name } })
  if (existing) throw new ApiError('A category with this name already exists', 409)

  const category = await prisma.newsArticleCategory.create({ data: parsed.data })
  return NextResponse.json({ data: category, message: 'Category created successfully', code: 'success', status: 201 }, { status: 201 })
})
