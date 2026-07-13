'use client'

import { useSyncExternalStore } from 'react'
import { mockAuditEntries, type AuditAction, type AuditEntry } from './audit-log-data'

/**
 * Module-level mutable store so real admin actions (user creation, borrow
 * approval, publication review, etc.) actually append a row here — mirrors
 * the exact pattern Batch 7 used to fix `/dashboard/publishing/review`'s
 * persistence bug (`use-review-queue.ts`). Previously `mockAuditEntries`
 * was a plain, read-only array: the page rendered a real DataTable with
 * filters/stats/a chart, but nothing in the app ever wrote to it, so it
 * could never grow no matter what an admin did in session.
 */
let entries: AuditEntry[] = [...mockAuditEntries]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return entries
}

function nextId() {
  const max = entries.reduce((m, e) => {
    const n = Number(e.id.replace('aud-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `aud-${String(max + 1).padStart(3, '0')}`
}

export interface LogAuditEventInput {
  actor: string
  action: AuditAction
  target: string
  ipAddress?: string
  notes: string
}

/** Appends a new audit entry, timestamped now, to the front of the log. */
export function logAuditEvent(input: LogAuditEventInput) {
  const created: AuditEntry = {
    id: nextId(),
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    ipAddress: input.ipAddress ?? '—',
    ...input,
  }
  entries = [created, ...entries]
  emitChange()
  return created
}

/** Live-subscribes to the shared audit log. */
export function useAuditLog() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockAuditEntries)
}
