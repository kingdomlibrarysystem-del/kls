'use client'

import { useEffect, useState, useCallback } from 'react'

/** Real fetch()-backed 2FA status + actions, replacing the previous toggle-that-did-nothing mock. */
export function useTwoFactor(userId: string | undefined) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const res = await fetch(`/api/auth/2fa?userId=${userId}`)
    const json = await res.json()
    setEnabled(!!json?.data?.enabled)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { enabled, loading, refetch }
}
