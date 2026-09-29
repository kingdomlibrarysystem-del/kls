import Link from 'next/link'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { EnrollmentRecord } from '../../../enrollments/_components/use-enrollments-admin'

interface CourseEnrollmentsPanelProps {
  /** This course's enrollments, loaded on the server by the page. */
  enrollments: EnrollmentRecord[]
}

/** Members enrolled in this course. Rows come from a courseId-scoped server query instead of downloading every enrollment and filtering in the browser. */
export function CourseEnrollmentsPanel({ enrollments }: CourseEnrollmentsPanelProps) {
  if (enrollments.length === 0) {
    return <EmptyState icon={Users} title="No enrollments yet" description="No member has enrolled in this course." />
  }

  return (
    <div className="divide-y divide-w-200 dark:divide-white/10">
      {enrollments.map((e) => (
        <Link
          key={e.id}
          href={`/dashboard/e-learning/enrollments/${e.id}`}
          className="flex items-center justify-between gap-3 py-2.5 hover:bg-form-highlight dark:hover:bg-white/10 -mx-2 px-2 rounded transition-colors"
        >
          <div className="min-w-0">
            <p className="font-lato text-sm font-semibold text-w-950 truncate">{e.member}</p>
            <p className="font-lato text-xs text-w-600">Enrolled {e.enrolledAt}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-lato text-xs text-w-700">{e.progress}%</span>
            <div className="w-16 h-1.5 rounded-full bg-w-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-w-600" style={{ width: `${e.progress}%` }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
