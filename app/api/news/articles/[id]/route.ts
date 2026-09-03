import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { notifyPublishSubscribers } from './notify-subscribers'

function serializeArticle(a: {
  id: string
  title: string
  content: string
  summary: string
  coverImage: string | null
  category: string
  language: string
  authorId: string
  authorName: string
  status: string
  publishedAt: Date | null
  isEdition: boolean
  featured: boolean
  createdAt: Date
}) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    summary: a.summary,
    coverImage: a.coverImage,
    category: a.category,
    language: a.language.toLowerCase(),
    authorId: a.authorId,
    authorName: a.authorName,
    status: a.status,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    isEdition: a.isEdition,
    featured: a.featured,
    createdAt: a.createdAt.toISOString(),
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await prisma.newsArticle.findUnique({ where: { id } })
  if (!article) {
    return NextResponse.json({ data: null, message: 'Article not found', code: 'error', status: 404 }, { status: 404 })
  }
  if (article.status !== 'PUBLISHED') {
    const auth = await requireStaff()
    if (auth.response) return auth.response
  }
  return NextResponse.json({ data: serializeArticle(article), message: 'Article fetched successfully', code: 'success', status: 200 })
}

/** Status-transition guard, mirrors PATCH /api/publications/[id]'s action-schema pattern exactly — staff-only throughout, no owner branch. */
const patchArticleSchema = z.union([
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('publish') }),
  z.object({ action: z.literal('toggleFeatured') }),
])

export const PATCH = withErrorHandling('/api/news/articles/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchArticleSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Article not found', 404)

  if (body.action === 'submit') {
    if (existing.status !== 'DRAFT') throw new ApiError('Only a draft article can be submitted', 409)
    const updated = await prisma.newsArticle.update({ where: { id }, data: { status: 'SUBMITTED' } })
    return NextResponse.json({ data: serializeArticle(updated), message: 'Article submitted for review', code: 'success', status: 200 })
  }

  if (body.action === 'approve') {
    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') throw new ApiError('Only a submitted or under-review article can be approved', 409)
    const updated = await prisma.newsArticle.update({ where: { id }, data: { status: 'APPROVED' } })
    return NextResponse.json({ data: serializeArticle(updated), message: 'Article approved', code: 'success', status: 200 })
  }

  if (body.action === 'reject') {
    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') throw new ApiError('Only a submitted or under-review article can be rejected', 409)
    const updated = await prisma.newsArticle.update({ where: { id }, data: { status: 'REJECTED' } })
    return NextResponse.json({ data: serializeArticle(updated), message: 'Article rejected', code: 'success', status: 200 })
  }

  if (body.action === 'publish') {
    if (existing.status !== 'APPROVED') throw new ApiError('Only an approved article can be published', 409)
    const updated = await prisma.newsArticle.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } })
    await notifyPublishSubscribers(updated)
    return NextResponse.json({ data: serializeArticle(updated), message: 'Article published', code: 'success', status: 200 })
  }

  const updated = await prisma.newsArticle.update({ where: { id }, data: { featured: !existing.featured } })
  return NextResponse.json({ data: serializeArticle(updated), message: 'Article updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/news/articles/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Article not found', 404)

  await prisma.newsArticle.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Article deleted successfully', code: 'success', status: 200 })
})
