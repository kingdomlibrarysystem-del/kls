import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { listCounselors, serializeCounselor } from '@/lib/care/data'
import { isObjectId } from '@/lib/server/object-id'
import { counselorSchema } from '@/lib/care/schemas'

/** GET /api/counseling/counselors — public: counselors taking bookings. ?all=1 — staff: including hidden ones. */
export const GET = withErrorHandling('/api/counseling/counselors', 'GET', async (request: NextRequest) => {
  const all = new URL(request.url).searchParams.get('all') === '1'
  if (all) {
    const auth = await requireStaff()
    if (auth.response) return auth.response
  }
  return NextResponse.json({ data: await listCounselors(!all), message: 'Counselors fetched successfully', code: 'success', status: 200 })
})

/** POST /api/counseling/counselors — staff: add a counselor. */
export const POST = withErrorHandling('/api/counseling/counselors', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const parsed = counselorSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  if (b.userId && (!isObjectId(b.userId) || !(await prisma.user.findUnique({ where: { id: b.userId }, select: { id: true } })))) throw new ApiError('That staff account does not exist', 400)
  const created = await prisma.counselor.create({
    data: { name: b.name, specialty: b.specialty, bio: b.bio || null, image: b.image ?? '', userId: b.userId || null, languages: b.languages ?? [], availability: b.availability || null, active: b.active ?? true },
  })
  return NextResponse.json({ data: serializeCounselor(created), message: 'Counselor added', code: 'success', status: 201 }, { status: 201 })
})
