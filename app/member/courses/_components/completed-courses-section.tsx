'use client'

import Link from 'next/link'
import { Award, GraduationCap, ChevronRight, CalendarPlus } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { isCertificateEligible, type CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'
import type { Certificate } from '@/app/member/_shared/use-certificates'
import { EnrollmentActionButton } from './enrollment-action-button'

interface CompletedCoursesSectionProps {
  completed: { enrollment: CourseEnrollment; course: CatalogCourse }[]
  onRequestSession: (course: CatalogCourse) => void
  certificates: Certificate[]
  onUnenroll: (enrollmentId: string) => void
  onPay: (course: CatalogCourse) => void
}

/**
 * Completed-courses list, extracted from MyCoursesPage to keep that file
 * under the 200-line cap. "Request Session" is a "Slack huddle"-style open
 * action per product decision — any authenticated member can request a
 * live session with any lecturer for any enrolled course, not gated to
 * completion (see in-progress-courses-section.tsx, which offers the same
 * action on courses still in progress).
 */
export function CompletedCoursesSection({ completed, onRequestSession, certificates, onUnenroll, onPay }: CompletedCoursesSectionProps) {
  if (completed.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Award size={16} color="var(--gold)" /> Completed
      </div>
      {completed.map(({ enrollment, course }) => {
        const lecturerName = course.instructor
        const certificate = isCertificateEligible(enrollment) ? certificates.find((c) => c.courseId === course.id) : undefined
        return (
          <div key={course.id} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, position: 'relative', overflow: 'hidden', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RemoteImage src={course.image} alt={course.title} fill sizes="32px" style={{ objectFit: 'cover' }} fallback={<GraduationCap size={18} color="var(--gold)" />} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{course.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {course.lessons} lessons • Completed
                {!isCertificateEligible(enrollment) && ' • Pass the assessment for a certificate'}
              </div>
            </div>
            <button
              onClick={() => onRequestSession(course)}
              aria-label={`Request a live session with ${lecturerName ?? 'the lecturer'} for ${course.title}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--teal-light)', background: 'transparent', color: 'var(--teal-light)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <CalendarPlus size={14} /> Request Session
            </button>
            <EnrollmentActionButton enrollment={enrollment} course={course} onUnenroll={onUnenroll} onPay={onPay} />
            {certificate ? (
              <Link href={`/member/certificates/${certificate.id}`} aria-label={`View certificate for ${course.title}`} style={{ display: 'flex' }}>
                <GraduationCap size={16} color="var(--gold)" />
              </Link>
            ) : (
              <ChevronRight size={16} color="var(--text-muted)" />
            )}
          </div>
        )
      })}
    </div>
  )
}
