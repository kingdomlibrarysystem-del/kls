import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff, requireAdmin } from '@/lib/auth/require-role'

export async function GET(request: NextRequest) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search')?.toLowerCase()

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {}

  const [totalItems, roles] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { users: true } } },
    }),
  ])

  const data = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    userCount: r._count.users,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data,
    message: 'Roles fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().optional(),
  permissions: z.array(z.string()).optional(),
})

export const POST = withErrorHandling('/api/roles', 'POST', async (request: NextRequest) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const parsed = createRoleSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.role.findUnique({ where: { name: body.name } })
  if (existing) throw new ApiError(`A role named "${body.name}" already exists`, 409)

  const role = await prisma.role.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      permissions: body.permissions ?? [],
    },
  })

  return NextResponse.json({ data: { ...role, userCount: 0 }, message: 'Role created successfully', code: 'success', status: 201 }, { status: 201 })
})
