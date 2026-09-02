import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Real NewsArticle API, mirrors /api/publications' query-param/status
 * shape. Public/member reads default to status=PUBLISHED unless the
 * caller is staff — News is admin/editor-authored (no contributor
 * role), so there's no owner-scoped branch anywhere in this module.
 */
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

const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const category = searchParams.get('category')
  const isEdition = searchParams.get('isEdition')
  const search = searchParams.get('search')?.toLowerCase()
  const requestedStatus = searchParams.get('status')

  const staffAuth = await requireStaff()
  const isStaff = !staffAuth.response

  const status = isStaff && requestedStatus && requestedStatus !== 'all' && VALID_STATUSES.includes(requestedStatus)
    ? requestedStatus
    : isStaff ? undefined : 'PUBLISHED'

  const where = {
    ...(status && { status: status as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' }),
    ...(category && { category }),
    ...(isEdition !== null && { isEdition: isEdition === 'true' }),
    ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { summary: { contains: search, mode: 'insensitive' as const } }] }),
  }

  const [totalItems, articles] = await Promise.all([
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: articles.map(serializeArticle),
    message: 'Articles fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createArticleSchema = z.object({
  authorId: z.string().min(1, 'authorId is required'),
  title: z.string().trim().min(3, 'title must be at least 3 characters'),
  content: z.string().trim().min(1, 'content is required'),
  summary: z.string().trim().min(1, 'summary is required'),
  coverImage: z.string().trim().optional(),
  category: z.string().trim().min(1, 'category is required'),
  language: z.enum(['EN', 'FR', 'RW']).default('EN'),
  isEdition: z.boolean().default(false),
})

export const POST = withErrorHandling('/api/news/articles', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createArticleSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const author = await prisma.user.findUnique({ where: { id: body.authorId } })
  if (!author) throw new ApiError('The specified author does not exist', 400)
  const authorName = author.name ?? `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim() || 'Staff'

  const article = await prisma.newsArticle.create({
    data: {
      title: body.title,
      content: body.content,
      summary: body.summary,
      coverImage: body.coverImage,
      category: body.category,
      language: body.language,
      authorId: body.authorId,
      authorName,
      isEdition: body.isEdition,
      status: 'DRAFT',
    },
  })

  return NextResponse.json({ data: serializeArticle(article), message: 'Article created successfully', code: 'success', status: 201 }, { status: 201 })
})
