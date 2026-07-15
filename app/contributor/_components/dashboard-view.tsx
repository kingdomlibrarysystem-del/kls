'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useMySubmissions } from '@/app/contributor/publishing/_components/use-my-submissions'
import { useCourseCatalog } from '@/app/dashboard/e-learning/_shared/use-course-catalog'
import { useRevenue } from '@/app/dashboard/publishing/revenue/_components/use-revenue'
import { mockProjects } from '@/app/dashboard/research/collaborations/_components/collaborations-data'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'
import { contributorStatConfig } from './dashboard-data'

/** Simulated network delay before mock stats become visible. */
const LOAD_DELAY_MS = 400

/**
 * Contributor dashboard stat cards: submissions, courses, research
 * projects, earnings — each value computed live from the same shared
 * stores their own dedicated pages (My Submissions, My Courses, My
 * Research, Earnings) already read, so this summary can never drift from
 * what those pages show.
 */
export function DashboardView() {
  const [loading, setLoading] = useState(true)
  const submissions = useMySubmissions()
  const courseCatalog = useCourseCatalog()
  const revenue = useRevenue()

  const myCourseCount = courseCatalog.filter((c) => c.author === CONTRIBUTOR_NAME).length
  const myProjectCount = mockProjects.filter((p) => p.contributors.some((c) => c.name === CONTRIBUTOR_NAME)).length
  const myEarnings = revenue
    .filter((r) => r.contributor === CONTRIBUTOR_NAME)
    .reduce((sum, r) => sum + Math.round((r.totalRevenue * r.contributorShare) / 100), 0)

  const values: Record<string, string> = {
    'My Submissions': String(submissions.length),
    'My Courses': String(myCourseCount),
    'Research Projects': String(myProjectCount),
    'Earnings (RWF)': myEarnings.toLocaleString(),
  }

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Loading dashboard stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 64, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {contributorStatConfig.map((s) => (
        <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
            <s.icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{values[s.label]}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
