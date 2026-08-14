'use client'

import { useEffect, useState } from 'react'
import type { LoginEvent } from './security-mock-data'

/** Fetches the signed-in user's own login history from the real /api/login-history. */
export function useLoginHistory(userId: string | undefined) {
  const [data, setData] = useState<LoginEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/login-history?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success') throw new Error(json.message ?? 'Failed to load login history')
        setData(json.data ?? [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load login history'))
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading, error }
}
