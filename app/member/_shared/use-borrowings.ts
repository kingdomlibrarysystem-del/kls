'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

/** Fetches the signed-in member's own borrowings from the real /api/borrowings, filtered by their session userId. */
export function useBorrowings() {
  const { user } = useAuth()
  const [data, setData] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/borrowings?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}
