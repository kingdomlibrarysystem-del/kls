'use client'

import { useEffect, useState, useCallback } from 'react'

export interface SessionEntry {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

/** Real fetch()-backed Sessions & Devices store, backed by /api/sessions. */
export function useSessions(userId: string | undefined, currentJti: string | undefined) {
  const [data, setData] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) { setData([]); setLoading(false); return }
    const params = new URLSearchParams({ userId, ...(currentJti && { currentJti }) })
    const res = await fetch(`/api/sessions?${params}`)
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [userId, currentJti])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, refetch }
}
