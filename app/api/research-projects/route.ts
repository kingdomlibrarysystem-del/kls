import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real ResearchProject API, replacing
 * app/dashboard/research/collaborations/_components/collaborations-data.ts.
 * `contributors` is resolved through the real ProjectMember join table
 * (the mock's Contributor.id was confirmed to be a self-invented id
 * space matching nothing else in the app).
 */
function serializeProject(p: {
  id: string
  title: string
  description: string
  status: string
  startDate: Date
  members: { user: { id: string; name: string | null; firstName: string | null; lastName: string | null } }[]
  _count?: { papers: number }
}) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    startDate: p.startDate.toISOString().split('T')[0],
    contributors: p.members.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim(),
    })),
    paperCount: p._count?.papers ?? 0,
  }
}

const INCLUDE = {
  members: { include: { user: { select: { id: true, name: true, firstName: true, lastName: true } } } },
  _count: { select: { papers: true } },
} as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')
  const contributorId = searchParams.get('contributorId')

  const where = {
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' }),
    ...(contributorId && { members: { some: { userId: contributorId } } }),
  }

  const [totalItems, projects] = await Promise.all([
    prisma.researchProject.count({ where }),
    prisma.researchProject.findMany({ where, include: INCLUDE, orderBy: { startDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: projects.map(serializeProject),
    message: 'Research projects fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().trim().min(1, 'description is required'),
  status: z.string().optional(),
  startDate: z.string().optional(),
  contributorIds: z.array(z.string()).optional(),
})

export const POST = withErrorHandling('/api/research-projects', 'POST', async (request: NextRequest) => {
  const parsed = createProjectSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data
  const contributorIds = body.contributorIds ?? []

  if (contributorIds.length > 0) {
    const found = await prisma.user.findMany({ where: { id: { in: contributorIds } } })
    if (found.length !== contributorIds.length) throw new ApiError('One or more specified contributors do not exist', 400)
  }

  const project = await prisma.researchProject.create({
    data: {
      title: body.title,
      description: body.description,
      status: (body.status as 'ACTIVE' | 'COMPLETED' | 'SUSPENDED') ?? 'ACTIVE',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      members: { create: contributorIds.map((userId) => ({ userId })) },
    },
    include: INCLUDE,
  })
  return NextResponse.json({ data: serializeProject(project), message: 'Research project created successfully', code: 'success', status: 201 }, { status: 201 })
})
