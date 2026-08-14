import { Users, TrendingDown } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { CourseAnalytics } from './progress-data'

interface CourseAnalyticsDetailModalProps {
  course: CourseAnalytics | null
  onClose: () => void
}

const statusConfig = {
  COMPLETED: { label: 'Completed', cls: 'bg-w-100 text-w-700 border-w-300' },
  ENROLLED: { label: 'Active', cls: 'bg-green-50 text-green-800 border-green-200' },
  DROPPED: { label: 'Dropped', cls: 'bg-red-50 text-red-800 border-red-200' },
}

/**
 * Full-data details view for one course's analytics: every enrolled member
 * (not just the top 3) and every lesson's dropoff rate (not just the top
 * 1-2 shown on the card). A Modal fits per SKILL.md's density rule — this
 * is comparative tabular data, not a large standalone content page.
 */
export function CourseAnalyticsDetailModal({ course, onClose }: CourseAnalyticsDetailModalProps) {
  return (
    <Modal open={!!course} onClose={onClose} title="Course Analytics — Full Detail" size="lg">
      {course && (
        <div className="space-y-5">
          <div>
            <h3 className="font-cinzel text-base font-semibold text-w-950">{course.title}</h3>
            <p className="font-lato text-xs text-w-600 mt-0.5">{course.enrolledCount} enrolled · {course.avgCompletion}% average completion</p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
              <Users size={12} className="text-w-600" /> Full Enrolled Roster ({course.enrolledMembers.length})
            </p>
            <div className="border border-w-300 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              {course.enrolledMembers.map((m) => (
                <div key={m.name} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-w-200 last:border-b-0 bg-white">
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
      )}
    </Modal>
  )
}
