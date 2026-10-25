import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { requirePermission } from '@/lib/auth/permissions'
import { listCollections } from '@/lib/data/klp-register'

/** KLP collections (the SS part of a KLP code). Staff read; Admin / library:approve manage. */
export const GET = withErrorHandling('/api/klp-collections', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  return NextResponse.json({ data: await listCollections({ withUsage: true }), message: 'Collections fetched', code: 'success', status: 200 })
})

const createSchema = z.object({
  code: z.string().trim().regex(/^\d{2}$/, 'Code must be two digits, e.g. 31').refine((c) => c !== '00', 'Code 00 is not used'),
  name: z.string().trim().min(2, 'Name is required').max(80),
  description: z.string().trim().max(300).optional(),
})

export const POST = withErrorHandling('/api/klp-collections', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission('library:approve', 'Only an admin (or a role allowed to approve resources) can manage KLP collections.')
  if (auth.response) return auth.response
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  await listCollections() // make sure the standard 01–30 exist before checking for a clash
  if (await prisma.publicationCollection.findUnique({ where: { code: parsed.data.code } })) throw new ApiError(`Code ${parsed.data.code} is already used`, 409)
  const c = await prisma.publicationCollection.create({ data: { code: parsed.data.code, name: parsed.data.name, description: parsed.data.description || null } })
  return NextResponse.json({ data: { id: c.id, code: c.code, name: c.name, description: c.description, active: c.active, usage: 0 }, message: `Collection ${c.code} added`, code: 'success', status: 201 }, { status: 201 })
})
