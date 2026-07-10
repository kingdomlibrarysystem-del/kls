'use client'

import { useSyncExternalStore } from 'react'
import { mockNotifications, type Notification, type NotificationType } from './notifications-data'

/**
 * Module-level mutable store so real app events can genuinely append a
 * notification here — mirrors the exact pattern used to fix the audit log
 * (`use-audit-log.ts`). Previously `mockNotifications` was a plain,
 * read-only array: `AppTopbar`'s bell badge and each portal layout's
 * `notificationCount` prop were hardcoded numbers with no connection to
 * this list at all, and the Notifications page itself could never grow no
 * matter what happened in session.
 */
let notifications: Notification[] = [...mockNotifications]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return notifications
}

function nextId() {
  const max = notifications.reduce((m, n) => {
    const num = Number(n.id)
    return Number.isFinite(num) && num > m ? num : m
  }, 0)
  return String(max + 1)
}

export interface AddNotificationInput {
  type: NotificationType
  title: string
  message: string
  href: string
}

/** Appends a new, unread notification, timestamped "Just now", to the front of the list. */
export function addNotification(input: AddNotificationInput) {
  const created: Notification = {
    id: nextId(),
    time: 'Just now',
    read: false,
    ...input,
  }
  notifications = [created, ...notifications]
  emitChange()
  return created
}

/** Marks a single notification read. */
export function markNotificationRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  emitChange()
}

/** Live-subscribes to the shared notifications list. */
export function useNotifications() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockNotifications)
}
