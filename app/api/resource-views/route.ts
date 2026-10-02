import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { isObjectId } from '@/lib/server/object-id'

const viewSchema = z.object({
  resourceId: z.string().min(1, 'resourceId is required'),
  /** Random id kept in the browser for signed-out visitors, so each browser counts once. Ignored when signed in. */
  anonymousId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
})

/**
 * POST /api/resource-views  { resourceId, anonymousId? } — public.
 * Records that a reader opened a book (the book detail pages call this on
 * load). No login needed. One row per viewer per resource (signed-in user id, or
 * the browser's anonymous id), so repeat clicks don't inflate the count.
 * Returns the resource's unique-viewer total.
 */
export const POST = withErrorHandling('/api/resource-views', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'resource-view', { max: 60, windowMs: 60_000 })

  const parsed = viewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { resourceId, anonymousId } = parsed.data
  if (!isObjectId(resourceId)) throw new ApiError('Resource not found', 404)

  const session = await getServerSession(authOptions)
  const viewerKey = session?.user?.id ? `u:${session.user.id}` : anonymousId ? `a:${anonymousId}` : null
  if (!viewerKey) throw new ApiError('anonymousId is required when signed out', 400)

  const resource = await prisma.resource.findUnique({ where: { id: resourceId }, select: { id: true } })
  if (!resource) throw new ApiError('Resource not found', 404)

  const key = { resourceId_viewerKey: { resourceId, viewerKey } }
  const already = await prisma.resourceView.findUnique({ where: key, select: { id: true } })
  if (!already) {
    await prisma.resourceView.upsert({ where: key, create: { resourceId, viewerKey }, update: {} })
    // A new viewer changes the landing page's counts/ranking: expire its 60s data cache now.
    try { revalidateTag('home-page', { expire: 0 }) } catch { /* outside a Next request (tests) */ }
  }
  const views = await prisma.resourceView.count({ where: { resourceId } })
  return NextResponse.json({ data: { resourceId, views }, message: 'View recorded', code: 'success', status: 200 })
})
