'use client'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { RankingBarChart } from '@/components/ui/ranking-bar-chart'
import { courseAnalytics } from './progress-data'
import { CourseAnalyticsCard } from './course-analytics-card'

/** Simulated network delay before mock analytics become visible. */
const LOAD_DELAY_MS = 450

/**
 * Completion-rate comparison chart followed by a grid of per-course
 * analytics cards (completion rate, top performers, dropoff points),
 * preceded by a brief simulated loading state.
 */
export function ProgressView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

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
          <CourseAnalyticsCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
