import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { expireServicesCache, serializeArea } from '@/lib/services/data'
import { areaSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'

/** POST — add a life area (Admin / services:manage). */
export const POST = withErrorHandling('/api/services/areas', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const parsed = areaSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const max = await prisma.lifeArea.aggregate({ _max: { sortOrder: true } })
  const a = await prisma.lifeArea.create({ data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? (max._max.sortOrder ?? 0) + 1 } })
  await expireServicesCache()
  return NextResponse.json({ data: serializeArea(a), message: `"${a.name}" added`, code: 'success', status: 201 }, { status: 201 })
})
