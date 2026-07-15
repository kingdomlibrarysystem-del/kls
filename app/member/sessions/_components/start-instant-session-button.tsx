'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useEnrollments } from '@/app/member/_shared/use-enrollments'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { startInstantSession } from '@/app/lecturer/_shared/use-session-requests'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Meet-style "start an instant meeting" action, symmetric to the
 * lecturer side's StartInstantSessionButton. John Doe (the one live
 * member persona in this mock) has 4 real enrollments across 3 different
 * lecturers, so which lecturer the instant session is "with" is
 * genuinely ambiguous — a course picker (driving the lecturer via
 * courseCatalog's lecturerId) resolves that the same way
 * RequestSessionModal already does for the scheduled flow, rather than
 * guessing or building a separate lecturer-only picker with no backing
 * multi-lecturer selection precedent.
 */
export function StartInstantSessionButton() {
  const router = useRouter()
  const enrollments = useEnrollments()
  const myCourses = enrollments
    .map((e) => courseCatalog.find((c) => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => !!c)
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState(myCourses[0]?.id ?? '')

  if (myCourses.length === 0) return null

  const handleStart = () => {
    const course = myCourses.find((c) => c.id === courseId) ?? myCourses[0]
    const lecturer = lecturerRoster.find((l) => l.id === course.lecturerId)
    const created = startInstantSession({
      learnerName: CURRENT_MEMBER_NAME,
      lecturerName: lecturer?.name ?? course.instructor,
      courseId: course.id,
      courseTitle: course.title,
    })
    router.push(`/member/sessions/${created.id}/room`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Start an instant session"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        <Zap size={14} /> Start Instant Session
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Start an Instant Session" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Starts a live session with your lecturer right now — no scheduling or approval step, same as Meet&apos;s
            &ldquo;Start an instant meeting.&rdquo;
          </p>

          <div>
            <FieldLabel htmlFor="instant-course" required>Course</FieldLabel>
            <select
              id="instant-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
            >
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title} — {c.instructor}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <ElegantButton type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</ElegantButton>
            <ElegantButton type="button" variant="primary" onClick={handleStart}>Start Now</ElegantButton>
          </div>
        </div>
      </Modal>
    </>
  )
}
