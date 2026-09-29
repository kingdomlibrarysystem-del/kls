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

/** DELETE one user. Standalone for the same reason as updateUserRequest. */
export async function removeUserRequest(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.message ?? 'Failed to delete user')
  }
}

/** Fetches the real user list from /api/users and exposes Create/Update/Delete that hit the real API, then refetch. */
export function useUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const res = await fetch('/api/users?pageSize=1000')
    const json = await res.json()
    setUsers(json.data ?? [])
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

  const removeUser = useCallback(async (id: string) => {
    await removeUserRequest(id)
    await refetch()
  }, [refetch])

  return { users, loading, addUser, updateUser, removeUser }
}
