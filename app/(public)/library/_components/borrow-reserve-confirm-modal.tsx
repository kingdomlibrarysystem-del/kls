'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, CalendarClock, Package, Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { defaultSystemSettings } from '@/app/dashboard/settings/_components/settings-schema'

export type BorrowReserveAction = 'borrow' | 'reserve' | null

interface ReservationResult {
  status: string
  queuePosition: number
}

interface BorrowReserveConfirmModalProps {
  action: BorrowReserveAction
  resourceId: string
  bookTitle: string
  bookAuthor: string
  /** Copies currently available — when known, shown as real pre-commit context. Omitted by callers that don't have it in scope; the modal degrades gracefully without it. */
  availableQty?: number
  onClose: () => void
}

/** Preview of the due date /api/borrowings will actually compute, from the real /api/settings — falls back to the schema default only until the fetch resolves, never as a substitute for it. */
function dueDateLabel(periodDays: number): string {
  const due = new Date()
  due.setDate(due.getDate() + periodDays)
  return due.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

/**
 * Confirms a real Borrow/Reserve action for the signed-in member — posts to
 * the real /api/borrowings or /api/reservations with the real session
 * userId, so the record is immediately visible on /member/borrowings or
 * /member/reservations. Only rendered when the caller has already
 * confirmed the visitor is authenticated (see library-browser.tsx and
 * publication-detail-view.tsx, which gate on useAuth() before opening this).
 */
export function BorrowReserveConfirmModal({ action, resourceId, bookTitle, bookAuthor, availableQty, onClose }: BorrowReserveConfirmModalProps) {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [borrowPeriodDays, setBorrowPeriodDays] = useState(defaultSystemSettings.defaultBorrowPeriodDays)

  useEffect(() => {
    if (action !== 'borrow') return
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => { if (json.data?.defaultBorrowPeriodDays) setBorrowPeriodDays(json.data.defaultBorrowPeriodDays) })
      .catch(() => {})
  }, [action])

  if (!action) return null

  const verb = action === 'borrow' ? 'Borrow' : 'Reserve'

  const handleConfirm = async () => {
    if (!user) return
    setError('')
    setSubmitting(true)
    try {
      const endpoint = action === 'borrow' ? '/api/borrowings' : '/api/reservations'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          resourceId,
          memberName: `${user.firstName} ${user.lastName}`.trim(),
          memberEmail: user.email,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not complete this ${verb.toLowerCase()} request.`)
      if (action === 'reserve') {
        setResult({ status: json.data.status, queuePosition: json.data.queuePosition })
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not complete this ${verb.toLowerCase()} request. Please try again.`)
    } finally {
      setSubmitting(false)
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
                {result.queuePosition <= 1
                  ? 'You are first in line — you will be notified as soon as a copy is ready for pickup.'
                  : `${result.queuePosition - 1} ${result.queuePosition - 1 === 1 ? 'person is' : 'people are'} ahead of you in the queue. You'll be notified when it's your turn.`}
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
                  <CalendarClock size={13} className="text-w-600 shrink-0" /> Due back by <span className="font-semibold text-w-950">{dueDateLabel(borrowPeriodDays)}</span>
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
        <ElegantButton variant="primary" loading={submitting} onClick={done ? handleClose : handleConfirm} className="w-full text-sm py-2">
          {done ? 'Close' : `Confirm ${verb}`}
        </ElegantButton>
      </div>
    </Modal>
  )
}
