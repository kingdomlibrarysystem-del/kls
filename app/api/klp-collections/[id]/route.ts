import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { isObjectId } from '@/lib/server/object-id'

interface Ctx { params: Promise<{ id: string }> }

const DENIED = 'Only an admin (or a role allowed to approve resources) can manage KLP collections.'

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  /** Hide from the pickers without touching records already filed in it. */
  active: z.boolean().optional(),
})

/** Rename / describe / (de)activate. The two-digit code never changes — it is printed inside every KLP code that uses it. */
export const PATCH = withErrorHandling('/api/klp-collections/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission('library:approve', DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Collection not found', 404)
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const existing = await prisma.publicationCollection.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Collection not found', 404)
  const c = await prisma.publicationCollection.update({ where: { id }, data: parsed.data })
  const usage = await prisma.resource.count({ where: { klpCollection: c.code } })
  return NextResponse.json({ data: { id: c.id, code: c.code, name: c.name, description: c.description, active: c.active, usage }, message: 'Collection updated', code: 'success', status: 200 })
})

/** Only an unused collection can be deleted; one with records is deactivated instead, so no code ever points nowhere. */
export const DELETE = withErrorHandling('/api/klp-collections/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission('library:approve', DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Collection not found', 404)
  const existing = await prisma.publicationCollection.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Collection not found', 404)
  const [usage, sequences] = await Promise.all([
    prisma.resource.count({ where: { klpCollection: existing.code } }),
    prisma.publicationSequence.count({ where: { collection: existing.code } }),
  ])
  if (usage > 0 || sequences > 0) throw new ApiError(`Collection ${existing.code} has been used for publication codes. Deactivate it instead of deleting it.`, 409)
  await prisma.publicationCollection.delete({ where: { id } })
  return NextResponse.json({ data: null, message: `Collection ${existing.code} deleted`, code: 'success', status: 200 })
})
