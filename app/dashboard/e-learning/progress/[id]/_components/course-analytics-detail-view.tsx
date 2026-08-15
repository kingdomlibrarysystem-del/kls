'use client'

import { ArrowLeft, Users, TrendingDown, BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useProgressAnalytics } from '../../_components/use-progress-analytics'

interface CourseAnalyticsDetailViewProps {
  id: string
}

const statusConfig = {
  COMPLETED: { label: 'Completed', cls: 'bg-w-100 text-w-700 border-w-300' },
  ENROLLED: { label: 'Active', cls: 'bg-green-50 text-green-800 border-green-200' },
  DROPPED: { label: 'Dropped', cls: 'bg-red-50 text-red-800 border-red-200' },
}

/**
 * Real details page for one course's full analytics, replacing the modal
 * that used to open from the progress cards' "View Full Details" button.
 * There is no single /api/.../:id aggregate for this — it reuses the same
 * useProgressAnalytics() module-cache hook the card grid reads from
 * (backed by /api/reports/e-learning-progress) and looks the course up by
 * id client-side, so this page also works when linked to directly.
 */
export function CourseAnalyticsDetailView({ id }: CourseAnalyticsDetailViewProps) {
  const { data: courseAnalytics, loading, error } = useProgressAnalytics()
  const course = courseAnalytics.find((c) => c.id === id)

  if (loading) {
    return (
      <div>
        <PageHeader title="Course Analytics" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div>
        <PageHeader title="Course Analytics" />
        <EmptyState
          icon={BarChart3}
          title="Course analytics not found"
          description={error || 'This course has no analytics or does not exist.'}
        />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/progress" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Progress
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <UniversalButton href="/dashboard/e-learning/progress" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Progress
        </UniversalButton>
      </div>

      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{course.title}</h1>
          <p className="font-lato text-sm text-w-600 mt-0.5">
            {course.enrolledCount} enrolled &middot; {course.avgCompletion}% average completion
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
            <Users size={12} className="text-w-600" /> Full Enrolled Roster ({course.enrolledMembers.length})
          </p>
          <div className="border border-w-300 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            {course.enrolledMembers.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between gap-3 px-3 py-2 border-b border-w-200 last:border-b-0 bg-white"
              >
                <span className="font-lato text-sm text-w-950 truncate flex-1">{m.name}</span>
                <span className={`px-2 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${statusConfig[m.status].cls}`}>
                  {statusConfig[m.status].label}
                </span>
                <span className="font-lato text-xs font-semibold text-w-700 w-10 text-right shrink-0">{m.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
            <TrendingDown size={12} className="text-red-600" /> Full Lesson-by-Lesson Dropoff
          </p>
          <div className="space-y-1.5">
            {course.allDropoffPoints.map((d) => (
              <div key={d.lesson} className="flex items-center gap-3">
                <span className="font-lato text-xs text-w-700 flex-1 truncate">{d.lesson}</span>
                <div className="w-32 h-1.5 bg-w-200 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${d.dropoffRate}%` }} />
                </div>
                <span className="font-lato text-xs font-semibold text-red-700 w-10 text-right shrink-0">{d.dropoffRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
