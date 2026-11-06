import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { hasPermission } from '@/lib/auth/permissions'
import { requestSchema } from '@/lib/services/schemas'
import { createServiceRequest, listAllRequests, listMemberRequests, REQUESTS_PERMISSION } from '@/lib/services/requests'

/** GET — your own requests; `?all=1` (services:requests / Admin) every request, `&status=` to filter. */
export const GET = withErrorHandling('/api/services/requests', 'GET', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const sp = new URL(request.url).searchParams
  if (sp.get('all') === '1') {
    if (!(await hasPermission(auth.session, REQUESTS_PERMISSION))) throw new ApiError('Your role does not handle service requests', 403)
    return NextResponse.json({ data: await listAllRequests(sp.get('status') ?? undefined), message: 'Requests', code: 'success', status: 200 })
  }
  return NextResponse.json({ data: await listMemberRequests(auth.session.userId), message: 'Your requests', code: 'success', status: 200 })
})

/** POST — a signed-in member asks for one or more sub-services and chooses call / messages / meeting. */
export const POST = withErrorHandling('/api/services/requests', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  const item = await createServiceRequest({
    userId: auth.session.userId, programId: b.programId, offeringIds: b.offeringIds, channel: b.channel,
    preferredAt: b.preferredAt ? new Date(b.preferredAt) : null, phone: b.phone?.replace(/[\s-]/g, '') || null, note: b.note,
  })
  return NextResponse.json({ data: item, message: `Request ${item.number} sent — we will contact you to arrange it.`, code: 'success', status: 201 }, { status: 201 })
})
