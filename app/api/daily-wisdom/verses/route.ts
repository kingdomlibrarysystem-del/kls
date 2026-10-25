import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { findSentVerseClash, getAllVerses, serializeVerse } from '@/lib/data/daily-wisdom'
import { createVerseSchema } from './schema'

/** GET /api/daily-wisdom/verses — staff. Every verse (sent for a day + automatic), newest first. */
export const GET = withErrorHandling('/api/daily-wisdom/verses', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const data = await getAllVerses()
  return NextResponse.json({ data, message: 'Verses fetched successfully', code: 'success', status: 200 })
})

/**
 * POST /api/daily-wisdom/verses — staff.
 * { text, reference, language, scheduledDate: "YYYY-MM-DD" | null, active? }
 * With a date: SENDS the verse for that day (shown instead of the automatic
 * one); one per day per language, 409 otherwise. Without: adds it to the
 * automatic rotation.
 */
export const POST = withErrorHandling('/api/daily-wisdom/verses', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createVerseSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  if (body.scheduledDate && (await findSentVerseClash(body.scheduledDate, body.language))) {
    throw new ApiError('A verse is already sent for that day in this language — edit it instead', 409)
  }

  const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true, firstName: true, lastName: true } })
  const createdByName = (user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Staff'

  const created = await prisma.dailyVerse.create({
    data: { ...body, createdById: auth.session.userId, createdByName },
  })
  return NextResponse.json(
    { data: serializeVerse(created), message: body.scheduledDate ? 'Verse sent for that day' : 'Verse added to the automatic rotation', code: 'success', status: 201 },
    { status: 201 },
  )
})
