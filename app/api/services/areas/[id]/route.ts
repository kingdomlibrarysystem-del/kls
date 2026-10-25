import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { isObjectId } from '@/lib/server/object-id'
import { expireServicesCache, serializeArea } from '@/lib/services/data'
import { areaSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Life area not found', 404)
  const a = await prisma.lifeArea.findUnique({ where: { id } })
  if (!a) throw new ApiError('Life area not found', 404)
  return a
}

export const PATCH = withErrorHandling('/api/services/areas/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  await find(id)
  const parsed = areaSchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const a = await prisma.lifeArea.update({ where: { id }, data: parsed.data })
  await expireServicesCache()
  return NextResponse.json({ data: serializeArea(a), message: 'Saved', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/services/areas/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  const a = await find(id)
  await prisma.lifeArea.delete({ where: { id } })
  await expireServicesCache()
  return NextResponse.json({ data: null, message: `"${a.name}" deleted`, code: 'success', status: 200 })
})
