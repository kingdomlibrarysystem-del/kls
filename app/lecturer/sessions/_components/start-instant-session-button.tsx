'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { LECTURER_NAME, lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { startInstantSession } from '@/app/lecturer/_shared/use-session-requests'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Meet-style "start an instant meeting" action for the lecturer side.
 * This mock's one lecturer persona teaches 4 courses (see lecturerRoster/
 * courseCatalog), so which course the instant session is "for" is
 * genuinely ambiguous — a course picker is warranted rather than
 * guessing. The learner side isn't ambiguous: there's only one live
 * member persona in this mock (CURRENT_MEMBER_NAME), so no learner picker
 * is built — that would be over-engineering a multi-user selector with
 * no real multi-learner data behind it.
 */
export function StartInstantSessionButton() {
  const router = useRouter()
  const lecturer = lecturerRoster.find((l) => l.name === LECTURER_NAME)
  const myCourses = courseCatalog.filter((c) => c.lecturerId === lecturer?.id)
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState(myCourses[0]?.id ?? '')

  if (myCourses.length === 0) return null

  const handleStart = () => {
    const course = myCourses.find((c) => c.id === courseId) ?? myCourses[0]
    const created = startInstantSession({
      learnerName: CURRENT_MEMBER_NAME,
      lecturerName: LECTURER_NAME,
      courseId: course.id,
      courseTitle: course.title,
    })
    router.push(`/lecturer/sessions/${created.id}/room`)
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
            Starts a live session with {CURRENT_MEMBER_NAME} right now — no scheduling or approval step, same as Meet&apos;s
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
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
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
