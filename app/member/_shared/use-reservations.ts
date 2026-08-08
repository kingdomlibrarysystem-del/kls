'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

/** Fetches the signed-in member's own reservations from the real /api/reservations, filtered by their session userId. */
export function useReservations() {
  const { user } = useAuth()
  const [data, setData] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/reservations?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}
