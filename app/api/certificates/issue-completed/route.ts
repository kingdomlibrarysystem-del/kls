import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { issuePendingCertificates, listPendingCertificates } from '@/lib/certificates/issue'

/** GET — members who completed a course but have no certificate yet (staff). */
export const GET = withErrorHandling('/api/certificates/issue-completed', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  return NextResponse.json({ data: await listPendingCertificates(), message: 'Pending certificates', code: 'success', status: 200 })
})

const schema = z.object({ enrollmentIds: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(2000).optional() })

/** POST — issue certificates to all of them (or only `enrollmentIds`). Each member is notified. */
export const POST = withErrorHandling('/api/certificates/issue-completed', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { issued, skipped } = await issuePendingCertificates(parsed.data.enrollmentIds)
  return NextResponse.json({
    data: { issued, skipped },
    message: issued === 0 ? 'Nothing to issue — everyone already has their certificate.' : `${issued} certificate${issued === 1 ? '' : 's'} issued. Each member was notified.`,
    code: 'success', status: 200,
  })
})
