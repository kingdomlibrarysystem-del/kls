'use client'

import { useEffect, useState } from 'react'

export interface CertificateRecord {
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
 * Real fetch()-backed Certificate store for the admin Certificates page.
 * Reading and revoking are genuinely admin-only actions with no
 * dependency on a real "current user," so this surface is fully real —
 * unlike issuance itself, which stays on the mock in
 * use-certificates.ts's issueCertificate (called only from the blocked
 * member enrollment write path in use-enrollments.ts).
 */
let cache: CertificateRecord[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCertificates(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/certificates?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch certificates (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch certificates')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useCertificatesAdmin() {
  const [data, setData] = useState<CertificateRecord[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadCertificates()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load certificates'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}

export async function refetchCertificatesAdmin(): Promise<void> {
  hasFetched = false
  await loadCertificates()
}

export async function revokeCertificateAdmin(id: string): Promise<CertificateRecord> {
  const res = await fetch(`/api/certificates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'revoke' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to revoke certificate')
  await refetchCertificatesAdmin()
  return json.data
}
