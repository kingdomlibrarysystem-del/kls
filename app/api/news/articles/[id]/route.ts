import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { notifyPublishSubscribers } from './notify-subscribers'
import { sanitizeHtml } from '@/lib/html-sanitizer'
import { broadcastNewsletterUpdate } from '@/lib/newsletter-broadcast'

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

/**
 * Workflow action schema — exactly mirrors the existing actions:
 * submit, approve, reject, publish, toggleFeatured.
 */
const actionSchema = z.union([
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('publish') }),
  z.object({ action: z.literal('toggleFeatured') }),
])

/**
 * Editable fields schema — allowed on every non-rejected article.
 * Prevents changing id, authorId, authorName, status, publishedAt,
 * featured, createdAt, or updatedAt through the normal edit payload.
 * NOTE: `action` is intentionally absent — the presence/absence of an
 * `action` key in the request body is how we distinguish workflow
 * actions from field edits (see PATCH handler below).
 */
const updateFieldsSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
  summary: z.string().trim().min(1, 'Summary is required').optional(),
  content: z.string().trim().min(1, 'Content is required').optional(),
  category: z.string().trim().min(1, 'Category is required').optional(),
  language: z.enum(['EN', 'FR', 'RW']).optional(),
  coverImage: z.string().trim().optional(),
  isEdition: z.boolean().optional(),
}).strict()

export const PATCH = withErrorHandling('/api/news/articles/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const raw = await request.json()
  const isAction = typeof raw === 'object' && raw !== null && 'action' in raw && typeof raw.action === 'string'

  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Article not found', 404)

  if (isAction) {
    const parsed = actionSchema.safeParse(raw)
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    const body = parsed.data

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
      await broadcastNewsletterUpdate({
        subject: `New Kingdom Library article: ${updated.title}`,
        title: updated.title,
        message: updated.summary,
        href: `/member/news/${updated.id}`,
      })
      return NextResponse.json({ data: serializeArticle(updated), message: 'Article published', code: 'success', status: 200 })
    }

    if (body.action === 'toggleFeatured') {
      const updated = await prisma.newsArticle.update({ where: { id }, data: { featured: !existing.featured } })
      return NextResponse.json({ data: serializeArticle(updated), message: 'Article updated successfully', code: 'success', status: 200 })
    }
  }

  if (existing.status === 'REJECTED') throw new ApiError('Rejected articles cannot be edited', 409)

  const parsed = updateFieldsSchema.safeParse(raw)
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const fields = parsed.data

  const updateData: Record<string, unknown> = {}
  if (fields.title !== undefined) updateData.title = fields.title
  if (fields.summary !== undefined) updateData.summary = fields.summary
  if (fields.content !== undefined) updateData.content = sanitizeHtml(fields.content)
  if (fields.category !== undefined) updateData.category = fields.category
  if (fields.language !== undefined) updateData.language = fields.language
  if (fields.coverImage !== undefined) updateData.coverImage = fields.coverImage || null
  if (fields.isEdition !== undefined) updateData.isEdition = fields.isEdition

  const updated = await prisma.newsArticle.update({ where: { id }, data: updateData })
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
