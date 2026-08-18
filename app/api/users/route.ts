import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

const BCRYPT_ROUNDS = 10

/** A random, URL-safe temporary password — shown once to the admin who created the account, never stored or logged in plaintext. */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url')
}

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: z.string().trim().min(1).max(60).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

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
  const auth = await requireStaff()
  if (auth.response) return auth.response

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

/**
 * Admin-created user — generates a real random temporary password, hashed
 * with bcrypt for storage the same way lib/auth-options.ts's authorize()
 * verifies it, so the account can log in immediately. The plaintext is
 * returned exactly once in this response (never stored or logged) so the
 * admin form can show it to whoever is creating the account — there is no
 * way to recover it afterward, only reset it.
 */
export const POST = withErrorHandling('/api/users', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createUserSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    throw new ApiError('A user with this email already exists', 409)
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

  const tempPassword = generateTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)

  const [firstName, ...rest] = body.name.split(/\s+/)
  const user = await prisma.user.create({
    data: {
      name: body.name,
      firstName: firstName || body.name,
      lastName: rest.join(' '),
      email: body.email,
      password: hashedPassword,
      status: body.status ? (body.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') : 'ACTIVE',
      roleId,
      emailVerified: new Date(),
    },
    include: ROLE_INCLUDE,
  })

  return NextResponse.json(
    { data: { ...serializeUser(user), temporaryPassword: tempPassword }, message: 'User created successfully', code: 'success', status: 201 },
    { status: 201 }
  )
})
