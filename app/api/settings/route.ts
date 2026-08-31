import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAdmin } from '@/lib/auth/require-role'

/**
 * Single-row settings — there is only ever one Settings document. GET
 * upserts a default row on first read so this never 404s; PATCH updates
 * that same row. No id is ever passed by the client — it always means
 * "the one settings row." GET stays public/unauthenticated: the values
 * (borrow period, renewal caps) aren't sensitive. PATCH (actually
 * changing policy) is admin-only.
 */
const settingsSchema = z.object({
  defaultBorrowPeriodDays: z.number().int().min(1).max(90),
  maxRenewals: z.number().int().min(0).max(10),
  reservationClaimWindowHours: z.number().int().min(1).max(168),
  maxConcurrentBorrows: z.number().int().min(1).max(20),
})

async function getOrCreateSettings() {
  const existing = await prisma.settings.findFirst()
  if (existing) return existing
  return prisma.settings.create({ data: {} })
}

export const GET = withErrorHandling('/api/settings', 'GET', async () => {
  const settings = await getOrCreateSettings()
  return NextResponse.json({ data: settings, message: 'Settings fetched successfully', code: 'success', status: 200 })
})

export const PATCH = withErrorHandling('/api/settings', 'PATCH', async (request: NextRequest) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const parsed = settingsSchema.partial().safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const existing = await getOrCreateSettings()
  const settings = await prisma.settings.update({ where: { id: existing.id }, data: parsed.data })

  return NextResponse.json({ data: settings, message: 'Settings updated successfully', code: 'success', status: 200 })
})
