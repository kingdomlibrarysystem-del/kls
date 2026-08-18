import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

export async function GET(request: NextRequest) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')

  const where = {
    ...(search && { email: { contains: search, mode: 'insensitive' as const } }),
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'PENDING' | 'ACCEPTED' | 'EXPIRED' }),
  }

  const [totalItems, invitations] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { role: { select: { id: true, name: true } } },
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: invitations,
    message: 'Invitations fetched successfully',
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

const createInvitationSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  roleId: z.string().min(1, 'roleId is required'),
})

export const POST = withErrorHandling('/api/invitations', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createInvitationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const role = await prisma.role.findUnique({ where: { id: body.roleId } })
  if (!role) throw new ApiError('The specified role does not exist', 400)

  const invitation = await prisma.invitation.create({
    data: {
      email: body.email,
      roleId: body.roleId,
      invitedByUserId: auth.session.userId,
    },
    include: { role: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: invitation, message: 'Invitation sent successfully', code: 'success', status: 201 }, { status: 201 })
})
