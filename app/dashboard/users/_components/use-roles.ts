'use client'

import { useState, useEffect } from 'react'

export interface RoleOption {
  id: string
  name: string
}

/** Fetches the real, admin-managed Role list from /api/roles — replaces the previous static KNOWN_ROLES array in the user create/edit form's Role selector. */
export function useRoles() {
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roles?pageSize=1000')
      .then((res) => res.json())
      .then((json) => setRoles(json.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return { roles, loading }
}
