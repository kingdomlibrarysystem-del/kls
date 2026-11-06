'use client'

import Link from 'next/link'
import { Award, GraduationCap, ChevronRight } from 'lucide-react'
import { OpenClassPanel } from '@/app/member/_shared/open-class-panel'
import { RemoteImage } from '@/components/ui/remote-image'
import type { CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'
import type { Certificate } from '@/app/member/_shared/use-certificates'
import { EnrollmentActionButton } from './enrollment-action-button'
import { useLanguage } from '@/contexts/language-context'

interface CompletedCoursesSectionProps {
  completed: { enrollment: CourseEnrollment; course: CatalogCourse }[]
  certificates: Certificate[]
  onUnenroll: (enrollmentId: string) => void
  onPay: (course: CatalogCourse) => void
}

/**
 * Completed-courses list. Each finished course has its Open class panel
 * (ask for a live online class, countdown, enter the class room) — open
 * classes are only for completed courses.
 */
export function CompletedCoursesSection({ completed, certificates, onUnenroll, onPay }: CompletedCoursesSectionProps) {
  const { t } = useLanguage()
  if (completed.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Award size={16} color="var(--gold)" /> {t("m_courses.completed")}
      </div>
      {completed.map(({ enrollment, course }) => {
        const certificate = certificates.find((c) => c.courseId === course.id && !c.revoked)
        return (
          <div key={course.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, position: 'relative', overflow: 'hidden', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RemoteImage src={course.image} alt={course.title} fill sizes="32px" style={{ objectFit: 'cover' }} fallback={<GraduationCap size={18} color="var(--gold)" />} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{course.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {course.lessons} {t("m_courses.lessons_label")} • {t("m_courses.completed")}
                {certificate
                  ? <> • <Link href={`/member/certificates/${certificate.id}`} style={{ color: 'var(--gold)', fontWeight: 600 }}>{t("m_courses.cert_ready")}</Link></>
                  : <> • {enrollment.assessmentPassed ? t("m_courses.cert_coming") : t("m_courses.pass_for_cert")}</>}
              </div>
            </div>
            {/* A finished course is not "left" — only an unpaid one shows Pay. */}
            {course.price > 0 && !enrollment.paid && <EnrollmentActionButton enrollment={enrollment} course={course} onUnenroll={onUnenroll} onPay={onPay} />}
            {certificate ? (
              <Link href={`/member/certificates/${certificate.id}`} aria-label={`View certificate for ${course.title}`} style={{ display: 'flex' }}>
                <GraduationCap size={16} color="var(--gold)" />
              </Link>
            ) : (
              <ChevronRight size={16} color="var(--text-muted)" />
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <OpenClassPanel course={{ id: course.id, title: course.title, lecturerId: course.lecturerId }} compact />
          </div>
          </div>
        )
      })}
    </div>
  )
}
