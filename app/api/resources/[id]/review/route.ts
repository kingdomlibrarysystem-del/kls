import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { approveResource, rejectResource, ReviewError, APPROVE_PERMISSION } from '@/lib/data/resource-review'
import { getResourceDetail } from '@/lib/data/resources'
import { isValidCollection } from '@/lib/data/klp-register'

interface RouteParams {
  params: Promise<{ id: string }>
}

const reviewSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), klpCollection: z.string().regex(/^\d{2}$/).optional() }),
  z.object({ action: z.literal('reject'), note: z.string().trim().min(3, 'Tell the author what needs to change').max(1000) }),
])

/**
 * Approve (publish) or send back a DRAFT library resource. Admin, or a role
 * with "library:approve". Approving assigns the KLP Code + Kingdom Library ID.
 */
export const POST = withErrorHandling('/api/resources/[id]/review', 'POST', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requirePermission(APPROVE_PERMISSION, 'Only an admin (or a role allowed to approve resources) can publish a draft.')
  if (auth.response) return auth.response
  const { id } = await params

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  try {
    if (body.action === 'approve') {
      if (body.klpCollection && !(await isValidCollection(body.klpCollection))) throw new ApiError('The specified KLP collection does not exist', 400)
      await approveResource(id, auth.session.userId, { collection: body.klpCollection })
    } else {
      await rejectResource(id, auth.session.userId, body.note)
    }
  } catch (e) {
    if (e instanceof ReviewError) throw new ApiError(e.message, e.status)
    throw e
  }

  const resource = await getResourceDetail(id, { includeDraft: true })
  return NextResponse.json({
    data: resource,
    message: body.action === 'approve' ? `Published${resource?.klpCode ? ` as ${resource.klpCode}` : ''}. Readers can now see it.` : 'Sent back to the author with your note.',
    code: 'success',
    status: 200,
  })
})
