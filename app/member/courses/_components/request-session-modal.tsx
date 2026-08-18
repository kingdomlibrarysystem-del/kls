'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { requestSession } from '@/lib/sessions/use-session-requests'
import { addNotification } from '@/app/dashboard/notifications/_components/use-notifications'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'

interface RequestSessionModalProps {
  course: CatalogCourse | null
  onClose: () => void
}

/**
 * Request-a-live-session form for an enrolled course, in progress or
 * completed — per product decision this is an open "Slack huddle"-style
 * action with no completion precondition. On submit, creates a real
 * PENDING SessionRequest via the real /api/session-requests (real
 * learnerId/lecturerId, the latter resolved from the course's own real
 * Course.lecturerId — not the mock lecturerRoster) and a real notification
 * addressed to the admin session-requests queue.
 */
export function RequestSessionModal({ course, onClose }: RequestSessionModalProps) {
  const { user } = useAuth()
  const [proposedTime, setProposedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!course) return null

  const currentMemberName = user ? `${user.firstName} ${user.lastName}`.trim() : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!user) return
    if (!proposedTime) { setError('Choose a proposed date and time'); return }

    setSubmitting(true)
    try {
      await requestSession({
        learnerId: user.id,
        lecturerId: course.lecturerId ?? undefined,
        courseId: course.id,
        proposedTime: new Date(proposedTime).toISOString(),
        notes: notes.trim() || undefined,
      })

      if (course.lecturerId) {
        addNotification({
          type: 'course',
          title: 'Session Requested',
          message: `${currentMemberName} requested a live session for "${course.title}" with ${course.instructor}.`,
          href: '/dashboard/e-learning/sessions',
          recipientRole: 'admin',
        }).catch(() => {})
      } else {
        // No lecturer assigned yet — notify every real lecturer (not just the admin queue) so any of them can claim it on approval.
        Promise.all(
          lecturerRoster.map((l) =>
            addNotification({
              type: 'course',
              title: 'Unassigned Session Request',
              message: `${currentMemberName} requested a live session for "${course.title}" — no lecturer assigned yet. Approve it to claim it.`,
              href: '/dashboard/e-learning/sessions',
              recipientRole: 'lecturer',
              recipientId: l.id,
            })
          )
        ).catch(() => {})
        addNotification({
          type: 'course',
          title: 'Unassigned Session Request',
          message: `${currentMemberName} requested a live session for "${course.title}" — no lecturer assigned yet.`,
          href: '/dashboard/e-learning/sessions',
          recipientRole: 'admin',
        }).catch(() => {})
      }

      setProposedTime('')
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Request a Live Session" size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Request a live Q&amp;A session with {course.instructor} for &ldquo;{course.title}&rdquo;.
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
          <ElegantButton type="submit" variant="primary" loading={submitting}>Send Request</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
