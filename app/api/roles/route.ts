import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ data: null, message: 'Missing required field: name', code: 'error', status: 400 }, { status: 400 })
    }

    const existing = await prisma.role.findUnique({ where: { name: body.name } })
    if (existing) {
      return NextResponse.json({ data: null, message: `A role named "${body.name}" already exists`, code: 'error', status: 409 }, { status: 409 })
    }

    const role = await prisma.role.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        permissions: Array.isArray(body.permissions) ? body.permissions : [],
      },
    })

    return NextResponse.json({ data: { ...role, userCount: 0 }, message: 'Role created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create role', code: 'error', status: 500 }, { status: 500 })
  }
}
