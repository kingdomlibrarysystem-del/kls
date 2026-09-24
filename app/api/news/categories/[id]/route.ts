import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = await prisma.newsArticleCategory.findUnique({ where: { id } })
  if (!category) return NextResponse.json({ data: null, message: 'Category not found', code: 'error', status: 404 }, { status: 404 })
  return NextResponse.json({ data: category, message: 'Category fetched successfully', code: 'success', status: 200 })
}

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex like #3b82f6').optional(),
})

export const PATCH = withErrorHandling('/api/news/categories/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.newsArticleCategory.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Category not found', 404)

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const dup = await prisma.newsArticleCategory.findUnique({ where: { name: parsed.data.name } })
    if (dup) throw new ApiError('A category with this name already exists', 409)
  }

  const updated = await prisma.$transaction([
    prisma.newsArticleCategory.update({ where: { id }, data: parsed.data }),
    ...(parsed.data.name && parsed.data.name !== existing.name
      ? [prisma.newsArticle.updateMany({ where: { category: existing.name }, data: { category: parsed.data.name } })]
      : []),
  ])
  return NextResponse.json({ data: updated[0], message: 'Category updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/news/categories/[id]', 'DELETE', async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.newsArticleCategory.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Category not found', 404)

  await prisma.newsArticleCategory.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Category deleted successfully', code: 'success', status: 200 })
})
