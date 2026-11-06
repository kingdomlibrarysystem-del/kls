import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { hasPermission } from '@/lib/auth/permissions'
import { requestActionSchema } from '@/lib/services/schemas'
import { REQUESTS_PERMISSION, updateServiceRequest, type RequestAction } from '@/lib/services/requests'

/** PATCH — staff schedule / complete / cancel; the member may cancel their own open request. */
export const PATCH = withErrorHandling('/api/services/requests/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const { id } = await params
  const parsed = requestActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  const action: RequestAction = b.action === 'schedule'
    ? { action: 'schedule', scheduledAt: new Date(b.scheduledAt), meetingLink: b.meetingLink || null, staffNote: b.staffNote || null }
    : b
  const isStaff = await hasPermission(auth.session, REQUESTS_PERMISSION)
  const item = await updateServiceRequest(id, { userId: auth.session.userId, isStaff }, action)
  const msg = { schedule: 'Scheduled — the member was notified', complete: 'Marked completed', cancel: 'Request cancelled' }[b.action]
  return NextResponse.json({ data: item, message: msg, code: 'success', status: 200 })
})
