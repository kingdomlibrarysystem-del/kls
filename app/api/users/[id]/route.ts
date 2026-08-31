import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff, requireAdmin } from '@/lib/auth/require-role'

const ROLE_INCLUDE = { role: { select: { name: true } } } as const

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
  notificationPreferences?: unknown
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
    notificationPreferences: (u.notificationPreferences as Record<string, boolean> | null) ?? {},
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireOwnerOrStaff(id)
  if (auth.response) return auth.response

  const user = await prisma.user.findUnique({ where: { id }, include: ROLE_INCLUDE })
  if (!user) {
    return NextResponse.json({ data: null, message: 'User not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeUser(user), message: 'User fetched successfully', code: 'success', status: 200 })
}

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.string().trim().min(1).optional(),
  /** Real per-category email preferences (see NotificationCategory in lib/notify.ts) — a member updates only their own via this route (see the auth branch below), staff never sets this for someone else. */
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
})

export const PATCH = withErrorHandling('/api/users/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = updateUserSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  // Changing name/email/status is routine staff account-management work;
  // reassigning WHICH role a user holds is a privilege-escalation surface
  // (a manager/staff account could otherwise promote themselves or anyone
  // else to Admin), so that specific field requires a real admin session.
  // Updating only your own notificationPreferences is a real self-service
  // action a plain member must be able to do — ownership-checked rather
  // than staff-gated, unlike every other field this route accepts.
  const isPreferencesOnly = body.notificationPreferences !== undefined && !body.name && !body.email && !body.status && !body.role
  const auth = await (body.role ? requireAdmin() : isPreferencesOnly ? requireOwnerOrStaff(id) : requireStaff())
  if (auth.response) return auth.response

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new ApiError('User not found', 404)

  if (body.email && body.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: body.email } })
    if (emailTaken) throw new ApiError('A user with this email already exists', 409)
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

  const [firstName, ...rest] = body.name ? body.name.trim().split(/\s+/) : [undefined]

  // Merge, not replace — setting one category's preference must not wipe
  // whatever else was already saved in this Json field.
  const mergedPreferences = body.notificationPreferences
    ? { ...(existing.notificationPreferences as Record<string, boolean> | null), ...body.notificationPreferences }
    : undefined

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name, firstName, lastName: rest.join(' ') }),
      ...(body.email && { email: body.email }),
      ...(body.status && { status: body.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }),
      ...(roleId && { roleId }),
      ...(mergedPreferences && { notificationPreferences: mergedPreferences }),
    },
    include: ROLE_INCLUDE,
  })

  return NextResponse.json({ data: serializeUser(user), message: 'User updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/users/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new ApiError('User not found', 404)

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'User deleted successfully', code: 'success', status: 200 })
})
