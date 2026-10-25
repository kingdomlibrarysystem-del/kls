import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeCounselor } from '@/lib/care/data'
import { counselorSchema } from '@/lib/care/schemas'
import { isObjectId } from '@/lib/server/object-id'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Counselor not found', 404)
  const c = await prisma.counselor.findUnique({ where: { id } })
  if (!c) throw new ApiError('Counselor not found', 404)
  return c
}

/** PATCH /api/counseling/counselors/[id] — staff: edit, link a staff account, or hide (`active: false`). */
export const PATCH = withErrorHandling('/api/counseling/counselors/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const { id } = await params
  await find(id)
  const parsed = counselorSchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  if (b.userId && (!isObjectId(b.userId) || !(await prisma.user.findUnique({ where: { id: b.userId }, select: { id: true } })))) throw new ApiError('That staff account does not exist', 400)
  const updated = await prisma.counselor.update({
    where: { id },
    data: {
      ...b,
      ...(b.bio !== undefined && { bio: b.bio || null }),
      ...(b.userId !== undefined && { userId: b.userId || null }),
      ...(b.availability !== undefined && { availability: b.availability || null }),
    },
  })
  return NextResponse.json({ data: serializeCounselor(updated), message: 'Counselor saved', code: 'success', status: 200 })
})

/** DELETE /api/counseling/counselors/[id] — staff. A counselor with sessions is hidden instead (history stays). */
export const DELETE = withErrorHandling('/api/counseling/counselors/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const { id } = await params
  await find(id)
  const used = await prisma.counselingSession.count({ where: { counselorId: id } })
  if (used > 0) {
    await prisma.counselor.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ data: { id, hidden: true }, message: 'This counselor has past sessions, so they were hidden instead of deleted', code: 'success', status: 200 })
  }
  await prisma.counselor.delete({ where: { id } })
  return NextResponse.json({ data: { id }, message: 'Counselor deleted', code: 'success', status: 200 })
})
