import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Users API, replacing a hardcoded 6-row mock array. This route
 * (and the admin Users Management page's own separate mock at
 * app/dashboard/users/_components/users-data.ts) was found still mocked
 * while wiring real auth — a leftover gap from an earlier phase's
 * migration that PROGRESS.md had marked complete but didn't actually
 * reach this file. `role` is serialized as the joined Role.name (the
 * real dynamic-role model), not a hardcoded string union.
 */
function serializeUser(u: {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  status: string
  role: { name: string } | null
  emailVerified: Date | null
  createdAt: Date
}) {
  return {
    id: u.id,
    name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    role: u.role?.name ?? 'Member',
    status: u.status.toLowerCase(),
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString().split('T')[0],
  }
}

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
const ROLE_INCLUDE = { role: { select: { name: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search')?.toLowerCase()
  const role = searchParams.get('role')
  const status = searchParams.get('status')

  const where = {
    ...(status && status !== 'all' && VALID_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }),
    ...(role && role !== 'all' && { role: { name: { equals: role, mode: 'insensitive' as const } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: ROLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: users.map(serializeUser),
    message: 'Users fetched successfully',
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

/** Admin-created user — no password set (no self-registration flow through this endpoint), so login for these rows only works once a real invite/set-password flow exists (out of scope here). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.email || !body.name) {
      return NextResponse.json({ data: null, message: 'Missing required fields: email, name', code: 'error', status: 400 }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ data: null, message: 'A user with this email already exists', code: 'error', status: 409 }, { status: 409 })
    }

    let roleId: string | undefined
    if (body.role) {
      const role = await prisma.role.upsert({
        where: { name: body.role },
        update: {},
        create: { name: body.role, permissions: [] },
      })
      roleId = role.id
    }

    const [firstName, ...rest] = String(body.name).trim().split(/\s+/)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        firstName: firstName || body.name,
        lastName: rest.join(' '),
        email: body.email,
        status: body.status ? body.status.toUpperCase() : 'ACTIVE',
        roleId,
      },
      include: ROLE_INCLUDE,
    })

    return NextResponse.json({ data: serializeUser(user), message: 'User created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create user', code: 'error', status: 500 }, { status: 500 })
  }
}
