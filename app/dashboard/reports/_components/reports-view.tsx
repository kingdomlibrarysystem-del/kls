'use client'

import { Users as UsersIcon, BookOpen, GraduationCap, FileText, FlaskConical, AlertTriangle, Sparkles, Brain, RefreshCcw, Gift, Newspaper } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useCrossModuleReport } from './use-cross-module-report'
import { buildModuleTrends } from './cross-module-data'

/**
 * Cross-module Reports & Analytics: stat cards for members, active loans,
 * enrollments, publications pending review, and active research projects —
 * every number a live aggregate query over the real collections those
 * modules' own migration phases created — plus a horizontal bar-list
 * comparing the five modules.
 */
export function ReportsView() {
  const { data: report, loading, error } = useCrossModuleReport()

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the cross-module report" description={error} />
  }

  if (loading || !report) {
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

  const stats = [
    { icon: UsersIcon, label: 'Total Members', value: report.totalMembers, color: 'text-w-950' },
    { icon: BookOpen, label: 'Active Loans', value: report.activeLoans, color: 'text-teal-700' },
    { icon: GraduationCap, label: 'Active Enrollments', value: report.activeEnrollments, color: 'text-purple-700' },
    { icon: FileText, label: 'Publications Pending Review', value: report.pendingPublications, color: 'text-yellow-700' },
    { icon: FlaskConical, label: 'Active Research Projects', value: report.activeResearchProjects, color: 'text-green-700' },
    { icon: Sparkles, label: 'Upcoming Beauty Appointments', value: report.upcomingBeautyAppointments, color: 'text-pink-700' },
    { icon: Brain, label: 'Active Counseling Sessions', value: report.activeCounselingSessions, color: 'text-indigo-700' },
    { icon: RefreshCcw, label: 'Active Rehab Intakes', value: report.activeRehabIntakes, color: 'text-orange-700' },
    { icon: Gift, label: 'Donations This Month', value: report.totalDonationsThisMonth, color: 'text-emerald-700' },
    { icon: Newspaper, label: 'Published News Articles', value: report.publishedNewsArticles, color: 'text-cyan-700' },
  ]

  const trends = buildModuleTrends(report)

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
