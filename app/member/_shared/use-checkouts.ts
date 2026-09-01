'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { MemberCheckout } from '../orders/_components/orders-data'

/** Fetches the signed-in member's own combined checkouts from /api/checkout, filtered by their session userId. */
export function useCheckouts() {
  const { user } = useAuth()
  const [data, setData] = useState<MemberCheckout[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/checkout?userId=${user.id}`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}
