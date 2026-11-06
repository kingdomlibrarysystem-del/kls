import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { isObjectId } from '@/lib/server/object-id'
import { expireServicesCache, serializeOffering } from '@/lib/services/data'
import { offeringSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Sub-service not found', 404)
  const o = await prisma.serviceOffering.findUnique({ where: { id } })
  if (!o) throw new ApiError('Sub-service not found', 404)
  return o
}

/** PATCH — edit, reorder or show/hide a sub-service. */
export const PATCH = withErrorHandling('/api/services/offerings/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  const existing = await find(id)
  const parsed = offeringSchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { image, slug, ...rest } = parsed.data
  if (slug && slug !== existing.slug && (await prisma.serviceOffering.findFirst({ where: { programId: existing.programId, slug }, select: { id: true } }))) {
    throw new ApiError(`"${slug}" is already used in this programme`, 409)
  }
  const o = await prisma.serviceOffering.update({ where: { id }, data: { ...rest, ...(slug && { slug }), ...(image !== undefined && { image: image || null }) } })
  await expireServicesCache()
  return NextResponse.json({ data: serializeOffering(o), message: 'Saved', code: 'success', status: 200 })
})

/** DELETE — removes a sub-service (past requests keep its name). Hiding it is the reversible option. */
export const DELETE = withErrorHandling('/api/services/offerings/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  const o = await find(id)
  await prisma.serviceOffering.delete({ where: { id } })
  await expireServicesCache()
  return NextResponse.json({ data: null, message: `"${o.name}" removed`, code: 'success', status: 200 })
})
