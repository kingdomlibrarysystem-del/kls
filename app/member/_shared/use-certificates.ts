'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

/** Real Certificate shape, matching /api/certificates' serializeCertificate. */
export interface Certificate {
  id: string
  userId: string
  member: string
  courseId?: string
  course: string
  issuedAt: string
  verificationCode: string
  revoked: boolean
}

/**
 * Fetches the signed-in member's own certificates from the real
 * /api/certificates, filtered by their session userId — replaces reading
 * the admin-facing shared mock store
 * (app/dashboard/e-learning/certificates/_components/use-certificates.ts)
 * and filtering client-side by a hardcoded member name. Issuance itself now
 * happens server-side (see app/api/_shared/issue-certificate-if-eligible.ts),
 * mirroring use-borrowings.ts's per-component fetch pattern.
 */
export function useCertificates() {
  const { user } = useAuth()
  const [data, setData] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/certificates?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}
