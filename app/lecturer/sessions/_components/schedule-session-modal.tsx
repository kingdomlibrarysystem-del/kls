'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { LECTURER_NAME } from '@/lib/identity/lecturer-identity'
import { requestSession } from '@/lib/sessions/use-session-requests'
import type { CatalogCourse } from '@/app/member/_shared/course-catalog-data'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

interface ScheduleSessionModalProps {
  open: boolean
  onClose: () => void
  courses: CatalogCourse[]
}

/**
 * Lecturer-initiated equivalent of the member's RequestSessionModal —
 * this mock previously only let members propose a scheduled session;
 * lecturers could approve/reject but never schedule one themselves.
 * Reuses the same requestSession() store call (PENDING, awaiting the
 * other party's response) since the store itself has no directionality
 * — either persona can be the proposer.
 */
export function ScheduleSessionModal({ open, onClose, courses }: ScheduleSessionModalProps) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [proposedTime, setProposedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!proposedTime) throw new Error('Choose a proposed date and time')
      const course = courses.find((c) => c.id === courseId) ?? courses[0]
      if (!course) throw new Error('Select a course')

      requestSession({
        learnerName: CURRENT_MEMBER_NAME,
        lecturerName: LECTURER_NAME,
        courseId: course.id,
        courseTitle: course.title,
        proposedTime: new Date(proposedTime).toISOString(),
        notes: notes.trim() || undefined,
      })

      setProposedTime('')
      setNotes('')
      setError('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule this session')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule a Session" size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Propose a future time for a session with {CURRENT_MEMBER_NAME} — they can accept it from My Sessions once it's confirmed.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="schedule-course" required>Course</FieldLabel>
          <select
            id="schedule-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          >
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="schedule-time" required>Proposed Date &amp; Time</FieldLabel>
          <input
            id="schedule-time"
            type="datetime-local"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          />
        </div>

        <div>
          <FieldLabel htmlFor="schedule-notes">What would you like to cover?</FieldLabel>
          <textarea
            id="schedule-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional — topics or agenda for this session…"
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Send Proposal</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
