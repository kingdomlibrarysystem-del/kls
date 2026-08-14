'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RankingBarChart } from '@/components/ui/ranking-bar-chart'
import { useProgressAnalytics } from './use-progress-analytics'
import type { CourseAnalytics } from './progress-data'
import { CourseAnalyticsCard } from './course-analytics-card'
import { CourseAnalyticsDetailModal } from './course-analytics-detail-modal'

/**
 * Completion-rate comparison chart followed by a grid of per-course
 * analytics cards (completion rate, top performers, dropoff points),
 * backed by real Enrollment/Lesson aggregates from
 * /api/reports/e-learning-progress. Each card links to a full details
 * modal with the complete enrolled roster and lesson dropoff data.
 */
export function ProgressView() {
  const { data: courseAnalytics, loading, error } = useProgressAnalytics()
  const [viewing, setViewing] = useState<CourseAnalytics | null>(null)

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading course analytics">
        <Skeleton className="h-56 w-full rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={BarChart3} title="Could not load course analytics" description={error} />
  }

  if (courseAnalytics.length === 0) {
    return <EmptyState icon={BarChart3} title="No course analytics yet" description="Analytics appear once members enroll in a course." />
  }

  const ranking = [...courseAnalytics]
    .sort((a, b) => b.avgCompletion - a.avgCompletion)
    .map((c) => ({ name: c.title, value: c.avgCompletion }))

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          <BarChart3 size={14} style={{ color: 'var(--gold)' }} /> Completion Rate by Course
        </h2>
        <RankingBarChart data={ranking} height={Math.max(160, ranking.length * 44)} ariaLabel="Average completion rate by course, ranked highest to lowest" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {courseAnalytics.map((course) => (
          <CourseAnalyticsCard key={course.id} course={course} onViewDetails={setViewing} />
        ))}
      </div>

      <CourseAnalyticsDetailModal course={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
