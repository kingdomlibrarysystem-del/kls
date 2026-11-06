import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { isObjectId } from '@/lib/server/object-id'
import { expireServicesCache, serializeOffering } from '@/lib/services/data'
import { offeringSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'
import { slugify } from '@/lib/services/shared'

/** POST — add a sub-service to a programme (Admin / services:manage). */
export const POST = withErrorHandling('/api/services/programs/[id]/offerings', 'POST', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id) || !(await prisma.serviceProgram.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError('Programme not found', 404)
  const parsed = offeringSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { slug: wanted, image, ...rest } = parsed.data
  const slug = wanted || slugify(rest.name)
  if (!slug) throw new ApiError('Give the sub-service a name with letters or numbers', 400)
  if (await prisma.serviceOffering.findFirst({ where: { programId: id, slug }, select: { id: true } })) {
    throw new ApiError(`This programme already has a sub-service at "${slug}"`, 409)
  }
  const max = await prisma.serviceOffering.aggregate({ where: { programId: id }, _max: { sortOrder: true } })
  const o = await prisma.serviceOffering.create({
    data: { ...rest, programId: id, slug, image: image || null, sortOrder: rest.sortOrder ?? (max._max.sortOrder ?? 0) + 1 },
  })
  await expireServicesCache()
  return NextResponse.json({ data: serializeOffering(o), message: `"${o.name}" added`, code: 'success', status: 201 }, { status: 201 })
})
