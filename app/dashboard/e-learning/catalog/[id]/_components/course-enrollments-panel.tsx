'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useEnrollmentsAdmin } from '../../../enrollments/_components/use-enrollments-admin'

interface CourseEnrollmentsPanelProps {
  courseId: string
}

/** Members enrolled in this course, reusing the already-cached cross-course Enrollments store (filtered client-side) rather than firing a duplicate courseId-scoped fetch. */
export function CourseEnrollmentsPanel({ courseId }: CourseEnrollmentsPanelProps) {
  const { data, loading } = useEnrollmentsAdmin()
  const enrollments = data.filter((e) => e.courseId === courseId)

  if (loading) return null

  if (enrollments.length === 0) {
    return <EmptyState icon={Users} title="No enrollments yet" description="No member has enrolled in this course." />
  }

  return (
    <div className="divide-y divide-w-200">
      {enrollments.map((e) => (
        <Link
          key={e.id}
          href={`/dashboard/e-learning/enrollments/${e.id}`}
          className="flex items-center justify-between gap-3 py-2.5 hover:bg-form-highlight -mx-2 px-2 rounded transition-colors"
        >
          <div className="min-w-0">
            <p className="font-lato text-sm font-semibold text-w-950 truncate">{e.member}</p>
            <p className="font-lato text-xs text-w-600">Enrolled {e.enrolledAt}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-lato text-xs text-w-700">{e.progress}%</span>
            <div className="w-16 h-1.5 rounded-full bg-w-200 overflow-hidden">
              <div className="h-full bg-w-600" style={{ width: `${e.progress}%` }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
