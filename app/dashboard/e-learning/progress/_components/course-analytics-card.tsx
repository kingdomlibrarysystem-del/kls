import { Trophy, TrendingDown, ArrowUpRight } from 'lucide-react'
import type { CourseAnalytics } from './progress-data'

interface CourseAnalyticsCardProps {
  course: CourseAnalytics
  onViewDetails: (course: CourseAnalytics) => void
}

/** One course's analytics: enrolled count, average completion, top performers, and dropoff callouts. */
export function CourseAnalyticsCard({ course, onViewDetails }: CourseAnalyticsCardProps) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-cinzel text-sm font-semibold text-w-950">{course.title}</h3>
        <span className="text-xs font-lato text-w-600">{course.enrolledCount} enrolled</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-lato text-w-700 mb-1">
          <span>Average Completion</span>
          <span className="font-semibold">{course.avgCompletion}%</span>
        </div>
        <div className="h-2 bg-w-200 rounded-full overflow-hidden">
          <div className="h-full bg-w-600 rounded-full" style={{ width: `${course.avgCompletion}%` }} />
        </div>
      </div>

      <div className="mb-4">
        <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
          <Trophy size={12} className="text-w-600" /> Top Performers
        </p>
        <ul className="space-y-1">
          {course.topPerformers.map((p) => (
            <li key={p.name} className="flex items-center justify-between text-xs font-lato text-w-950">
              <span className="truncate">{p.name}</span>
              <span className="text-w-600 font-semibold">{p.progress}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
          <TrendingDown size={12} className="text-red-600" /> Dropoff Points
        </p>
        <ul className="space-y-1">
          {course.dropoffPoints.map((d) => (
            <li key={d.lesson} className="flex items-center justify-between text-xs font-lato text-w-700">
              <span className="truncate">{d.lesson}</span>
              <span className="text-red-700 font-semibold">{d.dropoffRate}% drop</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onViewDetails(course)}
        aria-label={`View full analytics for ${course.title}`}
        className="flex items-center gap-1 mt-4 font-lato text-xs font-semibold text-w-700 hover:text-w-950 transition-colors"
      >
        View Full Details <ArrowUpRight size={12} />
      </button>
    </div>
  )
}
