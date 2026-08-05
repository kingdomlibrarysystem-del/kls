'use client'

import { useEffect, useState } from 'react'
import type { UserRole } from '@/contexts/auth-context'
import type { Notification, NotificationType } from './notifications-data'

/**
 * Real fetch()-backed Notification store, replacing the module-level
 * mock array. Role-level notifications need no specific person's real
 * identity — `useAuth()`'s mocked `user.role` is enough to filter — so
 * this surface is fully real, unlike Messaging's per-person write path.
 */
let cache: Notification[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadNotifications(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/notifications')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch notifications')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export interface AddNotificationInput {
  type: NotificationType
  title: string
  message: string
  href: string
  recipientRole: UserRole
}

export async function addNotification(input: AddNotificationInput): Promise<Notification> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create notification')
  hasFetched = false
  await loadNotifications()
  return json.data
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markRead' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to mark notification read')
  hasFetched = false
  await loadNotifications()
}

/**
 * Live-subscribes to the shared notifications list. Pass `forRole` to
 * get only that role's own notifications (what the Notifications page
 * uses) — omit it only for admin oversight contexts that genuinely need
 * the full cross-role list.
 */
export function useNotifications(forRole?: UserRole) {
  const [data, setData] = useState<Notification[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadNotifications()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load notifications'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const filtered = forRole ? data.filter((n) => n.recipientRole === forRole) : data
  return { data: filtered, loading, error }
}
