import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { openResource, serializeResource } from '@/lib/care/data'
import { careResourceSchema } from '@/lib/care/schemas'
import { isObjectId } from '@/lib/server/object-id'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/care/resources/[id] — signed-in members (published only; counts a view). */
export const GET = withErrorHandling('/api/care/resources/[id]', 'GET', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const r = await openResource((await params).id)
  if (!r) throw new ApiError('Resource not found', 404)
  return NextResponse.json({ data: r, message: 'Resource fetched', code: 'success', status: 200 })
})

/** PATCH — staff: edit, publish/unpublish, or { restore: true } from Trash. */
export const PATCH = withErrorHandling('/api/care/resources/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id) || !(await prisma.careResource.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError('Resource not found', 404)
  const raw = await request.json().catch(() => null)
  if (raw?.restore === true) {
    const r = await prisma.careResource.update({ where: { id }, data: { deletedAt: null, deletedBy: null } })
    return NextResponse.json({ data: serializeResource(r), message: 'Restored', code: 'success', status: 200 })
  }
  const parsed = careResourceSchema.partial().safeParse(raw)
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  const updated = await prisma.careResource.update({
    where: { id },
    data: {
      ...b,
      ...(b.body !== undefined && { body: b.body || null }),
      ...(b.mediaUrl !== undefined && { mediaUrl: b.mediaUrl || null }),
      ...(b.coverImage !== undefined && { coverImage: b.coverImage || null }),
    },
  })
  return NextResponse.json({ data: serializeResource(updated), message: 'Saved', code: 'success', status: 200 })
})

/** DELETE — staff: move to Trash; ?permanent=1 deletes for good. */
export const DELETE = withErrorHandling('/api/care/resources/[id]', 'DELETE', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id) || !(await prisma.careResource.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError('Resource not found', 404)
  if (new URL(request.url).searchParams.get('permanent') === '1') {
    await prisma.careResource.delete({ where: { id } })
    return NextResponse.json({ data: { id }, message: 'Deleted permanently', code: 'success', status: 200 })
  }
  await prisma.careResource.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: auth.session.userId } })
  return NextResponse.json({ data: { id }, message: 'Moved to Trash', code: 'success', status: 200 })
})
