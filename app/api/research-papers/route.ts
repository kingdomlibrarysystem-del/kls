import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real ResearchPaper API, replacing
 * app/dashboard/research/repository/_components/repository-data.ts
 * (`author`/`project` free text, matched only by spelling — now real
 * authorId/projectId FKs). `abstract` is a new real field the Submit
 * Paper form already collects but the mock silently discarded.
 */
function serializePaper(p: {
  id: string
  title: string
  abstract: string
  authorId: string
  authorName: string
  projectId: string
  project: { title: string }
  keywords: string[]
  publishedAt: Date
  status: string
}) {
  return {
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    authorId: p.authorId,
    author: p.authorName,
    projectId: p.projectId,
    project: p.project.title,
    keywords: p.keywords,
    publishedAt: p.publishedAt.toISOString().split('T')[0],
    status: p.status,
  }
}

const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'PUBLISHED']
const INCLUDE = { project: { select: { title: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')
  const projectId = searchParams.get('projectId')
  const authorId = searchParams.get('authorId')

  const where = {
    ...(projectId && { projectId }),
    ...(authorId && { authorId }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { authorName: { contains: search, mode: 'insensitive' as const } },
        { keywords: { has: search } },
      ],
    }),
  }

  const [totalItems, papers] = await Promise.all([
    prisma.researchPaper.count({ where }),
    prisma.researchPaper.findMany({ where, include: INCLUDE, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: papers.map(serializePaper),
    message: 'Research papers fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createPaperSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  abstract: z.string().trim().min(1, 'abstract is required'),
  authorId: z.string().min(1, 'authorId is required'),
  projectId: z.string().min(1, 'projectId is required'),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
})

export const POST = withErrorHandling('/api/research-papers', 'POST', async (request: NextRequest) => {
  const parsed = createPaperSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const [author, project] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.authorId } }),
    prisma.researchProject.findUnique({ where: { id: body.projectId } }),
  ])
  if (!author) throw new ApiError('The specified author does not exist', 400)
  if (!project) throw new ApiError('The specified project does not exist', 400)

  const paper = await prisma.researchPaper.create({
    data: {
      title: body.title,
      abstract: body.abstract,
      authorId: body.authorId,
      authorName: author.name ?? `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim(),
      projectId: body.projectId,
      keywords: body.keywords,
      status: 'SUBMITTED',
    },
    include: INCLUDE,
  })
  return NextResponse.json({ data: serializePaper(paper), message: 'Research paper submitted successfully', code: 'success', status: 201 }, { status: 201 })
})
