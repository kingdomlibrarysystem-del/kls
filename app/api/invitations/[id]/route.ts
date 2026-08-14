import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { role: { select: { id: true, name: true } } },
  })

  if (!invitation) {
    return NextResponse.json({ data: null, message: 'Invitation not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: invitation, message: 'Invitation fetched successfully', code: 'success', status: 200 })
}

const updateInvitationSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']).optional(),
  roleId: z.string().min(1).optional(),
})

export const PATCH = withErrorHandling('/api/invitations/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const parsed = updateInvitationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.invitation.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Invitation not found', 404)

  const invitation = await prisma.invitation.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.roleId !== undefined && { roleId: body.roleId }),
    },
    include: { role: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ data: invitation, message: 'Invitation updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/invitations/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params

  const existing = await prisma.invitation.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Invitation not found', 404)

  await prisma.invitation.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Invitation cancelled successfully', code: 'success', status: 200 })
})
