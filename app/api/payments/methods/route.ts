import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-error-handler'
import { requireAdmin } from '@/lib/auth/require-role'
import { getPaymentOptions, listPaymentMethodsAdmin } from '@/lib/payments/methods'

/** GET — payment methods payers can choose (enabled + configured). `?all=1` (admin) returns every method with its setup state. */
export const GET = withErrorHandling('/api/payments/methods', 'GET', async (request: Request) => {
  if (new URL(request.url).searchParams.get('all') === '1') {
    const auth = await requireAdmin()
    if (auth.response) return auth.response
    return NextResponse.json({ data: await listPaymentMethodsAdmin(), message: 'Payment methods', code: 'success', status: 200 })
  }
  return NextResponse.json({ data: await getPaymentOptions(), message: 'Payment methods', code: 'success', status: 200 })
})
