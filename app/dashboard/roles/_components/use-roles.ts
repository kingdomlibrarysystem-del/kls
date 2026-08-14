'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Role } from './roles-data'

export type NewRoleInput = { name: string; description: string; permissions: string[] }

/** Fetches the real role list from /api/roles and exposes Create/Update/Delete that hit the real API, then refetch. */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const res = await fetch('/api/roles?pageSize=1000')
    const json = await res.json()
    setRoles(json.data ?? [])
  }, [])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  const addRole = useCallback(async (data: NewRoleInput) => {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to create role')
    await refetch()
    return json.data as Role
  }, [refetch])

  const updateRole = useCallback(async (role: Role) => {
    const res = await fetch(`/api/roles/${role.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: role.name, description: role.description, permissions: role.permissions }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to update role')
    await refetch()
  }, [refetch])

  const removeRole = useCallback(async (id: string) => {
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      throw new Error(json?.message ?? 'Failed to delete role')
    }
    await refetch()
  }, [refetch])

  return { roles, loading, addRole, updateRole, removeRole }
}
