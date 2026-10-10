'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PlatformUser } from './users-data'

export type NewUserInput = { name: string; email: string; role: string; status: PlatformUser['status'] }

/** PATCH one user. Standalone so a page that only edits one user doesn't mount useUsers() and download the whole list. */
export async function updateUserRequest(id: string, data: NewUserInput): Promise<void> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to update user')
}

async function trashRequest(id: string, method: 'POST' | 'DELETE', fallback: string): Promise<void> {
  const res = await fetch(`/api/users/${id}/trash`, { method })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.message ?? fallback)
  }
}

/** Move one user to Trash (soft delete). Standalone for the same reason as updateUserRequest. */
export function trashUserRequest(id: string): Promise<void> {
  return trashRequest(id, 'POST', 'Failed to move the user to Trash')
}

/** Progress of a permanent delete, as streamed by DELETE /api/users/[id]. */
export interface DeleteProgress {
  done: number
  total: number
  label: string
}

/**
 * DELETE one user PERMANENTLY (see lib/data/user-deletion.ts), reporting each
 * finished step through `onProgress`. The server streams one JSON object per
 * line when asked for NDJSON; a refusal (409 etc.) still arrives as a normal
 * JSON error before anything is deleted. Standalone for the same reason as
 * updateUserRequest.
 */
export async function removeUserRequest(id: string, onProgress?: (p: DeleteProgress) => void): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Accept: 'application/x-ndjson' } })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.message ?? 'Failed to delete user')
  }
  if (!res.headers.get('content-type')?.includes('application/x-ndjson') || !res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false
  for (;;) {
    const { value, done } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const msg = JSON.parse(line) as { type: string; message?: string } & Partial<DeleteProgress>
      if (msg.type === 'progress') onProgress?.({ done: msg.done ?? 0, total: msg.total ?? 1, label: msg.label ?? '' })
      else if (msg.type === 'error') throw new Error(msg.message ?? 'Failed to delete user')
      else if (msg.type === 'done') finished = true
    }
    if (done) break
  }
  if (!finished) throw new Error('The connection closed before deleting finished. Refresh to see whether the user was deleted.')
}

/** Fetches the real user list from /api/users and exposes Create/Update/Delete that hit the real API, then refetch. */
export function useUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  /** Accounts in Trash (soft-deleted), listed separately. */
  const [trashed, setTrashed] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const [active, trash] = await Promise.all([
      fetch('/api/users?pageSize=1000').then((r) => r.json()),
      fetch('/api/users?pageSize=1000&trash=1').then((r) => r.json()),
    ])
    setUsers(active.data ?? [])
    setTrashed(trash.data ?? [])
  }, [])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  const addUser = useCallback(async (data: NewUserInput) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to create user')
    await refetch()
    return json.data as PlatformUser & { temporaryPassword: string }
  }, [refetch])

  const updateUser = useCallback(async (id: string, data: NewUserInput) => {
    await updateUserRequest(id, data)
    await refetch()
  }, [refetch])

  const removeUser = useCallback(async (id: string, onProgress?: (p: DeleteProgress) => void) => {
    try {
      await removeUserRequest(id, onProgress)
    } finally {
      // Refresh even on failure: a 404 means the row was already deleted elsewhere and must leave the table.
      await refetch()
    }
  }, [refetch])

  /** Soft delete: moves the account to Trash (restorable). */
  const trashUser = useCallback(async (id: string) => {
    try { await trashRequest(id, 'POST', 'Failed to move the user to Trash') } finally { await refetch() }
  }, [refetch])

  const restoreUser = useCallback(async (id: string) => {
    try { await trashRequest(id, 'DELETE', 'Failed to restore the user') } finally { await refetch() }
  }, [refetch])

  return { users, trashed, loading, addUser, updateUser, removeUser, trashUser, restoreUser }
}
