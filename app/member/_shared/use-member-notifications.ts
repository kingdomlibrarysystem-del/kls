'use client'

import { useEffect, useState, useCallback } from 'react'
import type { NotificationType } from '@/app/dashboard/notifications/_components/notifications-data'

export interface MemberNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  href: string
  read: boolean
  time: string
}

/**
 * Real per-person notifications for a signed-in member — queries
 * GET /api/notifications?recipientId=... (ownership-checked: a member can
 * only ever fetch their own, per lib/auth/require-role.ts's
 * requireOwnerOrStaff), unlike the admin dashboard's
 * app/dashboard/notifications/_components/use-notifications.ts, which is
 * role-broadcast only and has no concept of a specific real person.
 */
export function useMemberNotifications(userId: string | undefined) {
  const [data, setData] = useState<MemberNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/notifications?recipientId=${userId}`)
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch notifications')
      setData(json.data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    refetch()
  }, [refetch])

  // Real live delivery — a new Notification anywhere in the app broadcasts
  // over this stream (see lib/notify.ts), so the bell badge updates without
  // a reload/navigation. The event carries no payload; it's just a signal
  // to refetch the real list, keeping one source of truth for the shape.
  useEffect(() => {
    if (!userId) return
    const source = new EventSource('/api/notifications/stream')
    source.onmessage = () => refetch()
    return () => source.close()
  }, [userId, refetch])

  return { data, loading, error, refetch }
}

export async function markMemberNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markRead' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to mark notification read')
}
