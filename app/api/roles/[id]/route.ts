import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const body = await request.json()
    const existing = await prisma.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Role not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.name && body.name !== existing.name) {
      const nameTaken = await prisma.role.findUnique({ where: { name: body.name } })
      if (nameTaken) {
        return NextResponse.json({ data: null, message: `A role named "${body.name}" already exists`, code: 'error', status: 409 }, { status: 409 })
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(Array.isArray(body.permissions) && { permissions: body.permissions }),
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
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update role', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Role not found', code: 'error', status: 404 }, { status: 404 })
  }

  if (existing._count.users > 0) {
    return NextResponse.json(
      { data: null, message: `Cannot delete — ${existing._count.users} user(s) still assigned to this role`, code: 'error', status: 409 },
      { status: 409 }
    )
  }

  await prisma.role.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Role deleted successfully', code: 'success', status: 200 })
}
