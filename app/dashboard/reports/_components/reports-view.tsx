'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, GraduationCap, FileText, FlaskConical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { mockEnrollments } from '@/app/dashboard/e-learning/enrollments/_components/enrollments-data'
import { mockSubmissions } from '@/app/dashboard/publishing/review/_components/review-data'
import { mockProjects } from '@/app/dashboard/research/collaborations/_components/collaborations-data'
import { TOTAL_MEMBERS, ACTIVE_LOANS, buildModuleTrends } from './cross-module-data'

/** Simulated network delay before mock stats become visible. */
const LOAD_DELAY_MS = 400

/**
 * Cross-module Reports & Analytics: stat cards for members, active loans,
 * enrollments, publications pending review, and active research projects —
 * every number derived live from each module's own mock data — plus a
 * horizontal bar-list comparing the five modules.
 */
export function ReportsView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const activeEnrollments = mockEnrollments.filter((e) => e.status === 'ACTIVE').length
  const pendingPublications = mockSubmissions.length
  const activeResearchProjects = mockProjects.filter((p) => p.status === 'ACTIVE').length

  const stats = [
    { icon: Users, label: 'Total Members', value: TOTAL_MEMBERS, color: 'text-w-950' },
    { icon: BookOpen, label: 'Active Loans', value: ACTIVE_LOANS, color: 'text-teal-700' },
    { icon: GraduationCap, label: 'Active Enrollments', value: activeEnrollments, color: 'text-purple-700' },
    { icon: FileText, label: 'Publications Pending Review', value: pendingPublications, color: 'text-yellow-700' },
    { icon: FlaskConical, label: 'Active Research Projects', value: activeResearchProjects, color: 'text-green-700' },
  ]

  const trends = buildModuleTrends({
    totalMembers: TOTAL_MEMBERS,
    activeLoans: ACTIVE_LOANS,
    activeEnrollments,
    pendingPublications,
    activeResearchProjects,
  })

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading reports">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
            <s.icon size={18} className={`mx-auto mb-1.5 ${s.color}`} />
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-form-section border border-w-400 rounded-lg p-5">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-4">Module Activity Comparison</h2>
        <div className="space-y-3">
          {trends.map((t) => (
            <div key={t.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-lato text-xs text-w-700">{t.label}</span>
                <span className="font-lato text-xs font-semibold text-w-950">{t.value}</span>
              </div>
              <div className="h-2 bg-w-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${t.color}`} style={{ width: `${(t.value / t.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
