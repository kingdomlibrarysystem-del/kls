import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAdmin, requireStaff } from '@/lib/auth/require-role'
import { getCommissionPercent, setCommissionPercent } from '@/lib/data/publishing-revenue'

/** GET /api/publishing/commission — staff. The platform commission (%) on publishers' book sales/rentals. */
export const GET = withErrorHandling('/api/publishing/commission', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const percent = await getCommissionPercent()
  return NextResponse.json({ data: { percent, publisherPercent: 100 - percent }, message: 'Commission fetched', code: 'success', status: 200 })
})

const schema = z.object({
  percent: z.number().int('Use a whole number').min(0, 'Minimum 0%').max(100, 'Maximum 100%'),
  /** Also change the split of every book already published (earnings so far are not recalculated). */
  applyToPublished: z.boolean().default(false),
})

/** PUT /api/publishing/commission { percent, applyToPublished? } — admin only. */
export const PUT = withErrorHandling('/api/publishing/commission', 'PUT', async (request: NextRequest) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const result = await setCommissionPercent(parsed.data.percent, parsed.data.applyToPublished)
  return NextResponse.json({
    data: { ...result, publisherPercent: 100 - result.percent },
    message: parsed.data.applyToPublished
      ? `Commission set to ${result.percent}% — also applied to ${result.updatedBooks} published book${result.updatedBooks === 1 ? '' : 's'}`
      : `Commission set to ${result.percent}% for books approved from now on`,
    code: 'success',
    status: 200,
  })
})
