'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Invitation } from './invitations-data'

/** Fetches the real invitation list from /api/invitations and exposes Create/Resend/Cancel that hit the real API, then refetch. */
export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const res = await fetch('/api/invitations?pageSize=1000')
    const json = await res.json()
    setInvitations(json.data ?? [])
  }, [])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  /** Sends a new invitation. `roleName` is resolved to a real Role — upserted by name if it doesn't already exist, matching the pattern already established by /api/auth/register. */
  const addInvitation = useCallback(async (email: string, roleName: string) => {
    const roleRes = await fetch('/api/roles?pageSize=1000')
    const roleJson = await roleRes.json()
    const existingRole = (roleJson.data ?? []).find((r: { name: string }) => r.name === roleName)

    let roleId = existingRole?.id
    if (!roleId) {
      const createRes = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleName, permissions: [] }),
      })
      const createJson = await createRes.json()
      if (!createRes.ok) throw new Error(createJson.message ?? 'Failed to resolve role')
      roleId = createJson.data.id
    }

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, roleId }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to send invitation')
    await refetch()
    return json.data as Invitation
  }, [refetch])

  const resendInvitation = useCallback(async (id: string) => {
    const res = await fetch(`/api/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Failed to resend invitation')
    await refetch()
  }, [refetch])

  const removeInvitation = useCallback(async (id: string) => {
    const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      throw new Error(json?.message ?? 'Failed to cancel invitation')
    }
    await refetch()
  }, [refetch])

  return { invitations, loading, addInvitation, resendInvitation, removeInvitation }
}
