'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { SessionRequest } from './session-requests-data'

type ModalAction = 'approve' | 'reject'

interface SessionDecisionModalProps {
  request: SessionRequest | null
  action: ModalAction | null
  onClose: () => void
  onApprove: (scheduledAt: string, notes: string, lecturerId?: string) => void
  onReject: (notes: string) => void
}

/**
 * Approve/Reject confirmation modal for a session request — mirrors
 * review-modal.tsx's shape exactly (notes textarea, required on reject,
 * Tab-trapped while open). Approve additionally requires a scheduled
 * date/time per the confirmed design, defaulting to the learner's
 * proposed time so the common case is a single click. Relocated here
 * (from app/lecturer/sessions/requests/_components/) during portal
 * consolidation Phase 3 — admin's own session oversight page imports
 * this exact component directly rather than duplicating it, so it must
 * live outside the lecturer portal folder before that folder is deleted.
 */
export function SessionDecisionModal({ request, action, onClose, onApprove, onReject }: SessionDecisionModalProps) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [lecturerId, setLecturerId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (request && action) {
      setScheduledAt(request.proposedTime.slice(0, 16))
      setNotes('')
      setLecturerId(lecturerRoster[0]?.id ?? '')
      setError('')
    }
  }, [request, action])

  if (!request || !action) return null

  const isApprove = action === 'approve'
  const needsLecturer = isApprove && !request.lecturerId

  const handleConfirm = () => {
    try {
      if (isApprove) {
        if (!scheduledAt) throw new Error('Choose a scheduled date and time')
        if (needsLecturer && !lecturerId) throw new Error('Choose a lecturer to assign this session to')
        onApprove(new Date(scheduledAt).toISOString(), notes, needsLecturer ? lecturerId : undefined)
      } else {
        if (!notes.trim()) throw new Error('Rejecting a session request requires a reason in the notes field')
        onReject(notes)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this action')
    }
  }

  return (
    <Modal open onClose={onClose} title={isApprove ? 'Approve Session Request' : 'Reject Session Request'} size="md">
      <p className="font-lato text-sm text-w-700 mb-3">
        {isApprove ? 'Approving' : 'Rejecting'} a session with{' '}
        <span className="font-semibold text-w-950">{request.learnerName}</span> for &ldquo;{request.courseTitle}&rdquo;.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {isApprove && (
        <div className="mb-3">
          <FieldLabel htmlFor="scheduled-at" required>Scheduled Date &amp; Time</FieldLabel>
          <input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          />
        </div>
      )}

      {needsLecturer && (
        <div className="mb-3">
          <FieldLabel htmlFor="session-lecturer" required>Assign Lecturer</FieldLabel>
          <p className="font-lato text-xs text-w-600 mb-1.5">This request was submitted with no lecturer in mind — approving it claims it for the lecturer chosen here.</p>
          <select
            id="session-lecturer"
            value={lecturerId}
            onChange={(e) => setLecturerId(e.target.value)}
            className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
          >
            {lecturerRoster.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      <label htmlFor="session-decision-notes" className="block font-lato text-xs font-semibold text-w-700 uppercase tracking-wider mb-1.5">
        Notes {!isApprove && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id="session-decision-notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={isApprove ? 'Optional note for the learner…' : 'Explain why this request is being declined…'}
        className="w-full px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
      />

      <div className="flex gap-2 mt-4">
        <ElegantButton
          type="button"
          variant="primary"
          onClick={handleConfirm}
          className={isApprove ? '' : 'bg-red-600 border-red-700 hover:bg-red-700'}
        >
          {isApprove ? <CheckCircle size={14} className="inline-block mr-1" /> : <XCircle size={14} className="inline-block mr-1" />}
          Confirm {isApprove ? 'Approval' : 'Rejection'}
        </ElegantButton>
        <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
      </div>
    </Modal>
  )
}
