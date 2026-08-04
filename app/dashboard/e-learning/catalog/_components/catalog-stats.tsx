'use client'

import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import { useCourseCatalog } from '../../_shared/use-course-catalog'
import { statusConfig } from './catalog-config'
import type { CourseStatus } from './catalog-config'

/**
 * Total/Published/Draft/Total-Enrolled stat cards plus a courses-by-status
 * chart, reading the live `useCourseCatalog()` store. All 6 seeded courses
 * are PUBLISHED today (0 DRAFT) — but status is user-mutable (Add Course
 * defaults new courses to DRAFT), unlike the read-only seed data behind
 * research/repository's or quizzes' skipped charts, so this one is built
 * even though today's split is 6/0: it will show real variance the moment
 * a course is saved as a draft.
 */
export function CatalogStats() {
  const { data: catalog } = useCourseCatalog()
  const published = catalog.filter((c) => c.status === 'PUBLISHED').length
  const draft = catalog.filter((c) => c.status === 'DRAFT').length
  const totalEnrolled = catalog.reduce((sum, c) => sum + c.enrolledCount, 0)

  const stats = [
    { label: 'Total Courses', value: catalog.length, color: 'text-w-950' },
    { label: 'Published', value: published, color: 'text-green-700' },
    { label: 'Draft', value: draft, color: 'text-w-600' },
    { label: 'Total Enrolled', value: totalEnrolled, color: 'text-w-600' },
  ]

  const chartData = (Object.keys(statusConfig) as CourseStatus[]).map((s) => ({
    name: statusConfig[s].label,
    value: catalog.filter((c) => c.status === s).length,
  }))

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-form-highlight border border-w-300 rounded-lg p-4">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Courses by Status</h2>
        <CategoryBarChart data={chartData} height={180} ariaLabel="Number of courses by publication status" />
      </div>
    </div>
  )
}
