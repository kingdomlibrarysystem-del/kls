'use client'

import { useState } from 'react'
import { Award, GraduationCap, ChevronRight, CalendarPlus } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { isCertificateEligible } from '@/app/member/_shared/use-enrollments'
import { courseCatalog, type CatalogCourse } from '@/app/member/_shared/course-catalog-data'
import type { CourseEnrollment } from '@/app/member/_shared/enrollment-data'
import { RequestSessionModal } from './request-session-modal'

interface CompletedCoursesSectionProps {
  completed: { enrollment: CourseEnrollment; course: CatalogCourse }[]
}

/**
 * Completed-courses list, extracted from MyCoursesPage to keep that file
 * under the 200-line cap while adding the new "Request Session" action —
 * real per the Phase 3 design: only enabled once `enrollment.status ===
 * 'COMPLETED'`, reusing the same completion gate `getProgressPercent`
 * already establishes elsewhere, not a new invented eligibility concept.
 */
export function CompletedCoursesSection({ completed }: CompletedCoursesSectionProps) {
  const [requesting, setRequesting] = useState<CatalogCourse | null>(null)

  if (completed.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Award size={14} color="var(--gold)" /> Completed
      </div>
      {completed.map(({ enrollment, course }) => {
        const lecturerName = courseCatalog.find((c) => c.id === course.id)?.instructor
        return (
          <div key={course.id} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, position: 'relative', overflow: 'hidden', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RemoteImage src={course.image} alt={course.title} fill sizes="32px" style={{ objectFit: 'cover' }} fallback={<GraduationCap size={16} color="var(--gold)" />} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{course.title}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                {course.lessons} lessons • Completed
                {!isCertificateEligible(enrollment) && ' • Pass the assessment for a certificate'}
              </div>
            </div>
            <button
              onClick={() => setRequesting(course)}
              aria-label={`Request a live session with ${lecturerName ?? 'the lecturer'} for ${course.title}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--teal-light)', background: 'transparent', color: 'var(--teal-light)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
            >
              <CalendarPlus size={12} /> Request Session
            </button>
            {isCertificateEligible(enrollment) ? <GraduationCap size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
          </div>
        )
      })}

      <RequestSessionModal course={requesting} onClose={() => setRequesting(null)} />
    </div>
  )
}
