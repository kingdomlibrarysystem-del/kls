'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { PublicationSubmission } from './review-data'
import { SubmissionPreview } from './submission-preview'

interface ReviewModalProps {
  submission: PublicationSubmission | null
  action: 'approve' | 'reject' | null
  onClose: () => void
  onConfirm: (notes: string) => void
}

/**
 * Combined submission detail + Approve/Reject confirmation modal — shows
 * the full submission (cover, category, language, description) above the
 * review-notes textarea so a reviewer can see what they're deciding on
 * without a separate "View Details" step. Traps Tab focus within the
 * textarea/buttons while open, since `Modal` itself only handles
 * Escape-to-close.
 */
export function ReviewModal({ submission, action, onClose, onConfirm }: ReviewModalProps) {
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (submission && action) {
      setNotes('')
      setError('')
      textareaRef.current?.focus()
    }
  }, [submission, action])

  if (!submission || !action) return null

  const isApprove = action === 'approve'

  const handleConfirm = () => {
    try {
      if (!isApprove && !notes.trim()) throw new Error('Rejection requires a reason in the notes field')
      onConfirm(notes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this action')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusable = e.currentTarget.querySelectorAll<HTMLElement>('textarea, button')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <Modal open onClose={onClose} title={isApprove ? 'Approve Submission' : 'Reject Submission'} size="lg">
      <div onKeyDown={handleKeyDown}>
        <SubmissionPreview submission={submission} />

        <p className="font-lato text-sm text-w-700 mb-3">
          {isApprove ? 'Approving' : 'Rejecting'} <span className="font-semibold text-w-950">&ldquo;{submission.title}&rdquo;</span> by {submission.contributor}.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 font-lato text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <label htmlFor="review-notes" className="block font-lato text-xs font-semibold text-w-700 uppercase tracking-wider mb-1.5">
          Review Notes {!isApprove && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="review-notes"
          ref={textareaRef}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isApprove ? 'Optional feedback for the contributor…' : 'Explain why this submission is being rejected…'}
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
      </div>
    </Modal>
  )
}
