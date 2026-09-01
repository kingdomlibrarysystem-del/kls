'use client'

import { LogOut, CreditCard } from 'lucide-react'
import type { CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'
import { useLanguage } from '@/contexts/language-context'

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
  const { t } = useLanguage()
  if (course.price > 0 && !enrollment.paid) {
    return (
      <button
        onClick={() => onPay(course)}
        aria-label={`${t("m_courses.pay_to_continue")} ${course.title}`}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        <CreditCard size={14} /> {t("m_courses.pay_to_continue")}
      </button>
    )
  }

  return (
    <button
      onClick={() => { if (confirm(`${t("m_courses.unenroll_confirm")} "${course.title}"?`)) onUnenroll(enrollment.id) }}
      aria-label={`${t("m_courses.unenroll_confirm")} ${course.title}`}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      <LogOut size={14} /> {t("m_courses.unenroll")}
    </button>
  )
}
