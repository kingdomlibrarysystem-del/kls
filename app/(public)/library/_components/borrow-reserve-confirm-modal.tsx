'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { addBorrowing } from '@/app/member/_shared/use-borrowings'
import { addReservation } from '@/app/member/_shared/use-reservations'

export type BorrowReserveAction = 'borrow' | 'reserve' | null

interface BorrowReserveConfirmModalProps {
  action: BorrowReserveAction
  bookTitle: string
  bookAuthor: string
  onClose: () => void
}

/**
 * Confirms a real Borrow/Reserve action for an authenticated visitor —
 * persists into the shared member borrowings/reservations store so the
 * record is immediately visible on /member/borrowings or
 * /member/reservations. Only rendered when the caller has already
 * confirmed the visitor is authenticated (see library-browser.tsx and
 * publication-detail-view.tsx, which gate on useAuth() before opening this).
 */
export function BorrowReserveConfirmModal({ action, bookTitle, bookAuthor, onClose }: BorrowReserveConfirmModalProps) {
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!action) return null

  const verb = action === 'borrow' ? 'Borrow' : 'Reserve'

  const handleConfirm = () => {
    setError('')
    try {
      if (action === 'borrow') addBorrowing(bookTitle, bookAuthor)
      else addReservation(bookTitle, bookAuthor)
      setDone(true)
    } catch {
      setError(`Could not complete this ${verb.toLowerCase()} request. Please try again.`)
    }
  }

  const handleClose = () => {
    setDone(false)
    onClose()
  }

  return (
    <Modal open onClose={handleClose} title={`${verb} Request`} size="sm">
      <div className="text-center py-2">
        {done ? (
          <>
            <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
            <p className="font-lato text-sm text-w-950 mb-1">
              Your {verb.toLowerCase()} request for <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span> has been recorded.
            </p>
            <p className="font-lato text-xs text-w-600 mb-4">
              Track it anytime from {action === 'borrow' ? 'My Borrowings' : 'My Reservations'} in your member dashboard.
            </p>
          </>
        ) : (
          <>
            <p className="font-lato text-sm text-w-950 mb-4">
              {verb} <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span>?
            </p>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="font-lato text-xs text-red-700">{error}</p>
              </div>
            )}
          </>
        )}
        <ElegantButton variant="primary" onClick={done ? handleClose : handleConfirm} className="w-full text-sm py-2">
          {done ? 'Close' : `Confirm ${verb}`}
        </ElegantButton>
      </div>
    </Modal>
  )
}
