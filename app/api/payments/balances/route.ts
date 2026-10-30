import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-error-handler'
import { requireAdmin } from '@/lib/auth/require-role'
import { isMethodConfigured } from '@/lib/payments/methods'
import { intouchBalance } from '@/lib/payments/providers/intouch'
import { mtnMomoBalance } from '@/lib/payments/providers/mtn-momo'
import { urubutopayWalletBalance } from '@/lib/payments/providers/urubutopay'

/** GET — merchant balances of the configured providers that report one (admin). Each provider is asked in parallel; one failing doesn't hide the others. */
export const GET = withErrorHandling('/api/payments/balances', 'GET', async () => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const sources = [
    { method: 'INTOUCH' as const, fn: intouchBalance },
    { method: 'MTN_MOMO' as const, fn: mtnMomoBalance },
    { method: 'URUBUTOPAY' as const, fn: () => urubutopayWalletBalance() },
  ].filter((s) => isMethodConfigured(s.method))
  const results = await Promise.all(sources.map(async (s) => {
    try { return { method: s.method, ...(await s.fn()), error: null } } catch (e) { return { method: s.method, balance: null, currency: 'RWF', error: e instanceof Error ? e.message : 'Unavailable' } }
  }))
  return NextResponse.json({ data: results, message: 'Balances', code: 'success', status: 200 })
})
