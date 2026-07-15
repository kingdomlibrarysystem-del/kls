'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { requestSession } from '@/lib/sessions/use-session-requests'
import { addNotification } from '@/app/dashboard/notifications/_components/use-notifications'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { CatalogCourse } from '@/app/member/_shared/course-catalog-data'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

interface RequestSessionModalProps {
  course: CatalogCourse | null
  onClose: () => void
}

/**
 * Request-a-live-session form for an enrolled course, in progress or
 * completed — per product decision this is an open "Slack huddle"-style
 * action with no completion precondition. On submit, creates a real
 * PENDING SessionRequest and a real notification addressed to that
 * course's lecturer — the notification's `href` points at the lecturer's
 * real request queue, matching the "verified against real data" convention
 * every other notification in notifications-data.ts already follows.
 */
export function RequestSessionModal({ course, onClose }: RequestSessionModalProps) {
  const [proposedTime, setProposedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!course) return null

  const lecturer = lecturerRoster.find((l) => l.id === course.lecturerId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!proposedTime) throw new Error('Choose a proposed date and time')
      if (!lecturer) throw new Error('This course has no assigned lecturer')

      requestSession({
        learnerName: CURRENT_MEMBER_NAME,
        lecturerName: lecturer.name,
        courseId: course.id,
        courseTitle: course.title,
        proposedTime: new Date(proposedTime).toISOString(),
        notes: notes.trim() || undefined,
      })

      addNotification({
        type: 'course',
        title: 'Session Requested',
        message: `${CURRENT_MEMBER_NAME} requested a live session for "${course.title}".`,
        href: '/lecturer/sessions/requests',
        recipientRole: 'lecturer',
      })

      setProposedTime('')
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this request')
    }
  }

  return (
    <Modal open onClose={onClose} title="Request a Live Session" size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Request a live Q&amp;A session with {lecturer?.name ?? 'your lecturer'} for &ldquo;{course.title}&rdquo;.
        </p>

        {error && (
          <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
            {error}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="proposed-time" required>Proposed Date &amp; Time</FieldLabel>
          <input
            id="proposed-time"
            type="datetime-local"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          />
        </div>

        <div>
          <FieldLabel htmlFor="session-notes">What would you like to cover?</FieldLabel>
          <textarea
            id="session-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional — topics or questions for this session…"
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Send Request</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
