'use client'

import { useEffect, useState } from 'react'

export interface CrossModuleReport {
  totalMembers: number
  activeLoans: number
  activeEnrollments: number
  pendingPublications: number
  activeResearchProjects: number
  upcomingBeautyAppointments: number
  activeCounselingSessions: number
  activeRehabIntakes: number
  totalDonationsThisMonth: number
  publishedNewsArticles: number
}

/** Real fetch()-backed cross-module report, replacing cross-module-data.ts's mix of one real store and four superseded mocks. */
export function useCrossModuleReport() {
  const [data, setData] = useState<CrossModuleReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reports/cross-module')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch cross-module report (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch cross-module report')
        setData(json.data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cross-module report')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
