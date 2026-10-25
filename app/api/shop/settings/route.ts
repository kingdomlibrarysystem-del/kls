import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { getShopSettings } from '@/lib/shop/data'
import { SHOP_PERMISSION } from '@/lib/shop/shared'

/** GET /api/shop/settings — public (the cart shows the delivery fee). */
export const GET = withErrorHandling('/api/shop/settings', 'GET', async () => {
  return NextResponse.json({ data: await getShopSettings(), message: 'Shop settings fetched', code: 'success', status: 200 })
})

const schema = z.object({ deliveryFeeRwf: z.number().int('Whole RWF only').min(0).max(1_000_000) })

/** PUT /api/shop/settings { deliveryFeeRwf } — "shop:manage". */
export const PUT = withErrorHandling('/api/shop/settings', 'PUT', async (request: NextRequest) => {
  const auth = await requirePermission(SHOP_PERMISSION)
  if (auth.response) return auth.response
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const s = (await prisma.settings.findFirst()) ?? (await prisma.settings.create({ data: {} }))
  await prisma.settings.update({ where: { id: s.id }, data: { shopDeliveryFeeRwf: parsed.data.deliveryFeeRwf } })
  return NextResponse.json({ data: await getShopSettings(), message: 'Delivery fee saved', code: 'success', status: 200 })
})
