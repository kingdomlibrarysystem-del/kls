'use client'

import { LogOut, CreditCard } from 'lucide-react'
import type { CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'

interface EnrollmentActionButtonProps {
  enrollment: CourseEnrollment
  course: CatalogCourse
  onUnenroll: (enrollmentId: string) => void
  onPay: (course: CatalogCourse) => void
}

/**
 * Real Unenroll (any paid-or-free enrollment can leave — DROPPED, the
 * enum value already existed with no UI path to it) vs. Pay to Continue
 * (a priced course whose CourseOrder hasn't settled yet) — shared between
 * in-progress and completed sections so the branching logic isn't
 * duplicated across both.
 */
export function EnrollmentActionButton({ enrollment, course, onUnenroll, onPay }: EnrollmentActionButtonProps) {
  if (course.price > 0 && !enrollment.paid) {
    return (
      <button
        onClick={() => onPay(course)}
        aria-label={`Pay to continue ${course.title}`}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        <CreditCard size={14} /> Pay to Continue
      </button>
    )
  }

  return (
    <button
      onClick={() => { if (confirm(`Unenroll from "${course.title}"?`)) onUnenroll(enrollment.id) }}
      aria-label={`Unenroll from ${course.title}`}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      <LogOut size={14} /> Unenroll
    </button>
  )
}
