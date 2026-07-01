'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { courseAnalytics } from './progress-data'
import { CourseAnalyticsCard } from './course-analytics-card'

/** Simulated network delay before mock analytics become visible. */
const LOAD_DELAY_MS = 450

/**
 * Grid of per-course analytics cards (completion rate, top performers,
 * dropoff points), preceded by a brief simulated loading state.
 */
export function ProgressView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Loading course analytics">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {courseAnalytics.map((course) => (
        <CourseAnalyticsCard key={course.id} course={course} />
      ))}
    </div>
  )
}
