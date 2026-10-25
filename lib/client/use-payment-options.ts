'use client'

import { useEffect, useState } from 'react'
import type { PaymentOption } from '@/lib/payments/shared'

/**
 * The payment methods a payer can choose right now (enabled by an admin at
 * /dashboard/settings/payments and configured on the server). Fetched once
 * per page load and shared by every checkout dialog on the page.
 */
let cache: PaymentOption[] | null = null
let inflight: Promise<PaymentOption[]> | null = null

function load(): Promise<PaymentOption[]> {
  if (cache) return Promise.resolve(cache)
  inflight ??= fetch('/api/payments/methods')
    .then((r) => r.json())
    .then((j) => { cache = Array.isArray(j?.data) ? j.data : []; return cache! })
    .catch(() => [])
    .finally(() => { inflight = null })
  return inflight
}

export function usePaymentOptions() {
  const [options, setOptions] = useState<PaymentOption[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  useEffect(() => {
    let alive = true
    load().then((o) => { if (alive) { setOptions(o); setLoading(false) } })
    return () => { alive = false }
  }, [])
  return { options, loading }
}
