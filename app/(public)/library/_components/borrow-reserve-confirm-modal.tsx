'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, CalendarClock, Package, Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { addBorrowing } from '@/app/member/_shared/use-borrowings'
import { addReservation } from '@/app/member/_shared/use-reservations'
import type { Reservation } from '@/app/member/reservations/_components/reservations-data'
import { defaultSystemSettings } from '@/app/dashboard/settings/_components/settings-schema'

export type BorrowReserveAction = 'borrow' | 'reserve' | null

interface BorrowReserveConfirmModalProps {
  action: BorrowReserveAction
  bookTitle: string
  bookAuthor: string
  /** Copies currently available — when known, shown as real pre-commit context. Omitted by callers that don't have it in scope; the modal degrades gracefully without it. */
  availableQty?: number
  onClose: () => void
}

/** Real borrowing-policy default this app already defines (app/dashboard/settings), not a fabricated number — see settings-schema.ts's defaultSystemSettings. */
function dueDateLabel(): string {
  const due = new Date()
  due.setDate(due.getDate() + defaultSystemSettings.defaultBorrowPeriodDays)
  return due.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

/**
 * Confirms a real Borrow/Reserve action for an authenticated visitor —
 * persists into the shared member borrowings/reservations store so the
 * record is immediately visible on /member/borrowings or
 * /member/reservations. Only rendered when the caller has already
 * confirmed the visitor is authenticated (see library-browser.tsx and
 * publication-detail-view.tsx, which gate on useAuth() before opening this).
 */
export function BorrowReserveConfirmModal({ action, bookTitle, bookAuthor, availableQty, onClose }: BorrowReserveConfirmModalProps) {
  const [error, setError] = useState('')
  const [result, setResult] = useState<Reservation | null>(null)
  const [done, setDone] = useState(false)

  if (!action) return null

  const verb = action === 'borrow' ? 'Borrow' : 'Reserve'

  const handleConfirm = () => {
    setError('')
    try {
      if (action === 'borrow') {
        addBorrowing(bookTitle, bookAuthor)
      } else {
        setResult(addReservation(bookTitle, bookAuthor))
      }
      setDone(true)
    } catch {
      setError(`Could not complete this ${verb.toLowerCase()} request. Please try again.`)
    }
  }

  const handleClose = () => {
    setDone(false)
    setResult(null)
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
            {action === 'reserve' && result && (
              <p className="font-lato text-xs text-w-700 mb-1">
                {result.status === 'Ready'
                  ? 'A copy is available now — ready for pickup.'
                  : `${result.queue} ${result.queue === 1 ? 'person is' : 'people are'} ahead of you in the queue. You'll be notified when it's your turn.`}
              </p>
            )}
            <p className="font-lato text-xs text-w-600 mb-4">
              Track it anytime from {action === 'borrow' ? 'My Borrowings' : 'My Reservations'} in your member dashboard.
            </p>
          </>
        ) : (
          <>
            <p className="font-lato text-sm text-w-950 mb-3">
              {verb} <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span>?
            </p>

            <div className="text-left bg-form-highlight border border-w-300 rounded p-3 mb-4 space-y-1.5">
              {action === 'borrow' ? (
                <p className="flex items-center gap-2 font-lato text-xs text-w-700">
                  <CalendarClock size={13} className="text-w-600 shrink-0" /> Due back by <span className="font-semibold text-w-950">{dueDateLabel()}</span>
                </p>
              ) : (
                <p className="flex items-center gap-2 font-lato text-xs text-w-700">
                  <Users size={13} className="text-w-600 shrink-0" /> You&apos;ll be notified as soon as a copy is ready for pickup
                </p>
              )}
              {typeof availableQty === 'number' && (
                <p className="flex items-center gap-2 font-lato text-xs text-w-700">
                  <Package size={13} className="text-w-600 shrink-0" />
                  {availableQty > 0 ? `${availableQty} ${availableQty === 1 ? 'copy' : 'copies'} currently available` : 'No copies currently available'}
                </p>
              )}
            </div>

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
