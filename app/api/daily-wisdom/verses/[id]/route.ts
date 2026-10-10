import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { findSentVerseClash, serializeVerse } from '@/lib/data/daily-wisdom'
import { updateVerseSchema } from '../schema'

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/daily-wisdom/verses/[id] — staff. Edit text/reference/language/date, move between "sent" and "automatic", or switch it on/off. */
export const PATCH = withErrorHandling('/api/daily-wisdom/verses/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Verse not found', 404)
  const parsed = updateVerseSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.dailyVerse.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Verse not found', 404)

  const date = body.scheduledDate !== undefined ? body.scheduledDate : existing.scheduledDate
  const language = body.language ?? existing.language
  if (date && (await findSentVerseClash(date, language, id))) {
    throw new ApiError('A verse is already sent for that day in this language', 409)
  }

  const updated = await prisma.dailyVerse.update({ where: { id }, data: body })
  return NextResponse.json({ data: serializeVerse(updated), message: 'Verse updated', code: 'success', status: 200 })
})

/** DELETE /api/daily-wisdom/verses/[id] — staff. */
export const DELETE = withErrorHandling('/api/daily-wisdom/verses/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Verse not found', 404)
  const existing = await prisma.dailyVerse.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new ApiError('Verse not found', 404)
  await prisma.dailyVerse.delete({ where: { id } })
  return NextResponse.json({ data: { id }, message: 'Verse deleted', code: 'success', status: 200 })
})
