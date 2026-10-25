import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { isObjectId } from '@/lib/server/object-id'
import { expireServicesCache, serializeProgram } from '@/lib/services/data'
import { programSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'

type Ctx = { params: Promise<{ id: string }> }

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Programme not found', 404)
  const p = await prisma.serviceProgram.findUnique({ where: { id } })
  if (!p) throw new ApiError('Programme not found', 404)
  return p
}

/** PATCH — edit, reorder or show/hide a programme. */
export const PATCH = withErrorHandling('/api/services/programs/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  const existing = await find(id)
  const parsed = programSchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { image, slug, ...rest } = parsed.data
  if (slug && slug !== existing.slug && (await prisma.serviceProgram.findUnique({ where: { slug } }))) throw new ApiError(`"/services/${slug}" is already used`, 409)
  const p = await prisma.serviceProgram.update({ where: { id }, data: { ...rest, ...(slug && { slug }), ...(image !== undefined && { image: image || null }) } })
  await expireServicesCache()
  return NextResponse.json({ data: serializeProgram(p), message: 'Saved', code: 'success', status: 200 })
})

/** DELETE — removes a programme for good (hiding it is the reversible option). */
export const DELETE = withErrorHandling('/api/services/programs/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const { id } = await params
  const p = await find(id)
  await prisma.serviceProgram.delete({ where: { id } })
  await expireServicesCache()
  return NextResponse.json({ data: null, message: `"${p.name}" deleted`, code: 'success', status: 200 })
})
