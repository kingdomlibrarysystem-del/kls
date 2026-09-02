'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { NewsArticle } from '../../_shared/news-data'

interface ReviewModalProps {
  article: NewsArticle | null
  action: 'approve' | 'reject' | null
  onClose: () => void
  onConfirm: (notes: string) => void
}

/** Approve/Reject confirmation modal, adapted from Publishing's review-modal.tsx. Review notes aren't sent to the server (article has no notes field) — same known limitation Publishing's own reject flow has. */
export function ReviewModal({ article, action, onClose, onConfirm }: ReviewModalProps) {
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (article && action) {
      setNotes('')
      setError('')
      textareaRef.current?.focus()
    }
  }, [article, action])

  if (!article || !action) return null

  const isApprove = action === 'approve'

  const handleConfirm = () => {
    try {
      if (!isApprove && !notes.trim()) throw new Error('Rejection requires a reason in the notes field')
      onConfirm(notes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this action')
    }
  }

  return (
    <Modal open onClose={onClose} title={isApprove ? 'Approve Article' : 'Reject Article'} size="lg">
      <div>
        <p className="font-lato text-sm text-w-700 mb-3">
          {isApprove ? 'Approving' : 'Rejecting'} <span className="font-semibold text-w-950">&ldquo;{article.title}&rdquo;</span> by {article.authorName}.
        </p>

        {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 font-lato text-xs"><AlertCircle size={13} /> {error}</div>}

        <label htmlFor="review-notes" className="block font-lato text-xs font-semibold text-w-700 uppercase tracking-wider mb-1.5">
          Review Notes {!isApprove && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="review-notes"
          ref={textareaRef}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isApprove ? 'Optional feedback for the author…' : 'Explain why this article is being rejected…'}
          className="w-full px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        />

        <div className="flex gap-2 mt-4">
          <ElegantButton type="button" variant="primary" onClick={handleConfirm} className={isApprove ? '' : 'bg-red-600 border-red-700 hover:bg-red-700'}>
            {isApprove ? <CheckCircle size={14} className="inline-block mr-1" /> : <XCircle size={14} className="inline-block mr-1" />}
            Confirm {isApprove ? 'Approval' : 'Rejection'}
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
