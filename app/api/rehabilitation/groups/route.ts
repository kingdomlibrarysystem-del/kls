import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** Real SupportGroup directory API. GET mirrors /api/clinics; POST here means "join a group" (creates a RehabGroupMember row), not "create a group" — distinct semantics from a Beauty/Counseling-style booking POST. */
function serializeGroup(g: { id: string; name: string; focus: string; description: string; meetingCadence: string; image: string }) {
  return { id: g.id, name: g.name, focus: g.focus, description: g.description, meetingCadence: g.meetingCadence, image: g.image }
}

export async function GET() {
  const groups = await prisma.supportGroup.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({
    data: groups.map(serializeGroup),
    message: 'Support groups fetched successfully',
    code: 'success',
    status: 200,
  })
}

const joinGroupSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  groupId: z.string().min(1, 'groupId is required'),
})

export const POST = withErrorHandling('/api/rehabilitation/groups', 'POST', async (request: NextRequest) => {
  const parsed = joinGroupSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, group] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.supportGroup.findUnique({ where: { id: body.groupId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!group) throw new ApiError('The specified group does not exist', 400)

  const existing = await prisma.rehabGroupMember.findUnique({ where: { groupId_userId: { groupId: body.groupId, userId: body.userId } } })
  if (existing) throw new ApiError('You have already joined this group', 409)

  const membership = await prisma.rehabGroupMember.create({ data: { groupId: body.groupId, userId: body.userId } })

  return NextResponse.json({ data: { id: membership.id, groupId: membership.groupId, userId: membership.userId }, message: 'Joined group successfully', code: 'success', status: 201 }, { status: 201 })
})
