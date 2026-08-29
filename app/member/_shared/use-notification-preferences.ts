'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Real per-category email preferences for the signed-in member, backed by
 * GET/PATCH /api/users/[id] — replaces notification-preferences-section.tsx's
 * previous local-only useState (never persisted, never actually gated any
 * email). `save` merges one category's on/off into the existing real
 * notificationPreferences JSON via a real PATCH, matching this codebase's
 * other per-user fetch/save hooks (e.g. use-enrollments.ts).
 */
export function useNotificationPreferences(userId: string | undefined) {
  const [data, setData] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) { setData({}); return }
    const res = await fetch(`/api/users/${userId}`)
    const json = await res.json()
    if (res.ok && json.code === 'success') setData(json.data.notificationPreferences ?? {})
  }, [userId])

  useEffect(() => {
    setLoading(true)
    refetch().finally(() => setLoading(false))
  }, [refetch])

  const save = useCallback(async (category: string, enabled: boolean) => {
    if (!userId) return
    setData((prev) => ({ ...prev, [category]: enabled }))
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationPreferences: { [category]: enabled } }),
    })
    if (!res.ok) await refetch()
  }, [userId, refetch])

  return { data, loading, save }
}
