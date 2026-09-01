'use client'

import Link from 'next/link'
import { PlayCircle, GraduationCap, CalendarPlus } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { getProgressPercent, getNextLessonId, type CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import { useLessonsByCourse } from '@/app/member/_shared/use-lessons'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'
import { EnrollmentActionButton } from './enrollment-action-button'
import { useLanguage } from '@/contexts/language-context'

interface InProgressCoursesSectionProps {
  inProgress: { enrollment: CourseEnrollment; course: CatalogCourse }[]
  onRequestSession: (course: CatalogCourse) => void
  onUnenroll: (enrollmentId: string) => void
  onPay: (course: CatalogCourse) => void
}

/**
 * In-progress ("Continue Learning") course rows, extracted from
 * MyCoursesPage to keep that file under the 200-line cap while adding
 * "Request Session" here too — per product decision, session requests are
 * a "Slack huddle" open action available from any enrolled course, not
 * gated to COMPLETED (see completed-courses-section.tsx, which now shares
 * the same unrestricted requestSession() call).
 */
export function InProgressCoursesSection({ inProgress, onRequestSession, onUnenroll, onPay }: InProgressCoursesSectionProps) {
  const { t } = useLanguage()
  const { data: lessonsByCourse } = useLessonsByCourse()
  if (inProgress.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <PlayCircle size={16} color="var(--teal-light)" /> {t("m_courses.continue_learning")}
      </div>
      {inProgress.map(({ enrollment, course }) => {
        const progress = getProgressPercent(enrollment)
        const nextLessonId = getNextLessonId(enrollment, lessonsByCourse[course.id]?.lessons)
        return (
          <div key={course.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RemoteImage src={course.image} alt={course.title} fill sizes="40px" style={{ objectFit: 'cover' }} fallback={<GraduationCap size={22} color="var(--gold)" />} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{course.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{course.instructor} • {enrollment.completedLessonIds.length}/{enrollment.totalLessons} {t("m_courses.lessons_label")}</div>
              <div style={{ width: '100%', height: 4, background: 'var(--bg-section)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal-light)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
            <button
              onClick={() => onRequestSession(course)}
              aria-label={`Request a live session with ${course.instructor} for ${course.title}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--teal-light)', background: 'transparent', color: 'var(--teal-light)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <CalendarPlus size={14} /> {t("m_courses.request_session")}
            </button>
            <EnrollmentActionButton enrollment={enrollment} course={course} onUnenroll={onUnenroll} onPay={onPay} />
            {nextLessonId ? (
              <Link
                href={`/member/courses/${course.id}/lessons/${nextLessonId}`}
                aria-label={`Resume ${course.title}`}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--teal-light)', background: 'transparent', color: 'var(--teal-light)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
              >
                {t("m_courses.resume")}
              </Link>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("m_courses.no_lessons")}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
