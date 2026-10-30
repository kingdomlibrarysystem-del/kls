import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { expireServicesCache, getPublicServices, serializeProgram } from '@/lib/services/data'
import { programSchema, SERVICES_PERMISSION } from '@/lib/services/schemas'
import { slugify } from '@/lib/services/shared'

/** GET — visible programmes and life areas (public, cached). */
export const GET = withErrorHandling('/api/services/programs', 'GET', async () => {
  return NextResponse.json({ data: await getPublicServices(), message: 'Services', code: 'success', status: 200 })
})

/** POST — add a programme (Admin / services:manage). */
export const POST = withErrorHandling('/api/services/programs', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission(SERVICES_PERMISSION)
  if (auth.response) return auth.response
  const parsed = programSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { slug: wanted, image, ...rest } = parsed.data
  const slug = wanted || slugify(rest.name)
  if (!slug) throw new ApiError('Give the programme a name with letters or numbers', 400)
  if (await prisma.serviceProgram.findUnique({ where: { slug } })) throw new ApiError(`The web address "/services/${slug}" is already used — change the name or address`, 409)
  const max = await prisma.serviceProgram.aggregate({ _max: { sortOrder: true } })
  const p = await prisma.serviceProgram.create({ data: { ...rest, slug, image: image || null, sortOrder: rest.sortOrder ?? (max._max.sortOrder ?? 0) + 1 } })
  await expireServicesCache()
  return NextResponse.json({ data: serializeProgram(p), message: `"${p.name}" added`, code: 'success', status: 201 }, { status: 201 })
})
