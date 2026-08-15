'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { MemberOrder } from '../orders/_components/orders-data'

/** Fetches the signed-in member's own orders from the real /api/orders, filtered by their session userId. */
export function useOrders() {
  const { user } = useAuth()
  const [data, setData] = useState<MemberOrder[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/orders?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}
