import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })

  if (!role) {
    return NextResponse.json({ data: null, message: 'Role not found', code: 'error', status: 404 }, { status: 404 })
  }

  const { _count, ...roleFields } = role

  return NextResponse.json({
    data: { ...roleFields, userCount: _count.users },
    message: 'Role fetched successfully',
    code: 'success',
    status: 200,
  })
}

const updateRoleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  permissions: z.array(z.string()).optional(),
})

export const PATCH = withErrorHandling('/api/roles/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const parsed = updateRoleSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.role.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Role not found', 404)

  if (body.name && body.name !== existing.name) {
    const nameTaken = await prisma.role.findUnique({ where: { name: body.name } })
    if (nameTaken) throw new ApiError(`A role named "${body.name}" already exists`, 409)
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.permissions !== undefined && { permissions: body.permissions }),
    },
    include: { _count: { select: { users: true } } },
  })

  const { _count, ...roleFields } = role

  return NextResponse.json({
    data: { ...roleFields, userCount: _count.users },
    message: 'Role updated successfully',
    code: 'success',
    status: 200,
  })
})

export const DELETE = withErrorHandling('/api/roles/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params

  const existing = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!existing) throw new ApiError('Role not found', 404)

  if (existing._count.users > 0) {
    throw new ApiError(`Cannot delete — ${existing._count.users} user(s) still assigned to this role`, 409)
  }

  await prisma.role.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Role deleted successfully', code: 'success', status: 200 })
})
