'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AuditAction, AuditEntry } from './audit-log-data'

/** Fetches audit log entries from the real /api/audit-log, paginated. */
export function useAuditLog() {
  const [data, setData] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const res = await fetch('/api/audit-log?pageSize=1000')
    const json = await res.json()
    setData(json.data ?? [])
  }, [])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}

export interface LogAuditEventInput {
  actor: string
  actorId?: string
  action: AuditAction
  target: string
  targetId?: string
  targetType?: string
  ipAddress?: string
  notes: string
}

/** Records a real audit log entry via POST /api/audit-log. Fire-and-forget at every call site — a logging failure should never block the real action it's describing. */
export async function logAuditEvent(input: LogAuditEventInput) {
  try {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch (error) {
    console.error('Failed to record audit log entry:', error)
  }
}
