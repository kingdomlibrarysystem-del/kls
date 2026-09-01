'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, Smartphone, CreditCard, XCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

export type BuyAction = 'SALE' | 'RENTAL' | null

interface BuyConfirmModalProps {
  action: BuyAction
  resourceId: string
  bookTitle: string
  priceRwf: number
  onClose: () => void
  /** Called once, the moment the Order settles PAID — e.g. so a cart-triggered checkout can remove the now-fulfilled cart line. Optional: the public library's direct Reserve/Borrow buttons don't need it, since there's no cart row to clean up. */
  onPaid?: () => void
}

type Stage = 'form' | 'pending' | 'paid' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 3 * 60_000

/**
 * Real Reserve (SALE)/Borrow (RENTAL) checkout — two real payment rails,
 * same shape as CourseCheckoutModal: PayPack (a real mobile-money
 * charge, no sandbox) or Stripe (redirects to a real Checkout Session).
 * Polls GET /api/orders/:id until the PayPack prompt is approved/
 * declined. settleOrder (app/api/orders/settle.ts) creates the real
 * Reservation/Borrow row once PAID — this modal only starts payment.
 */
export function BuyConfirmModal({ action, resourceId, bookTitle, priceRwf, onClose, onPaid }: BuyConfirmModalProps) {
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState<Stage>('form')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  if (!action) return null

  const verb = action === 'SALE' ? 'Reserve' : 'Borrow'

  const startPolling = (id: string) => {
    const startedAt = Date.now()
    pollTimer.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setStage('failed')
        setError('We haven\'t received confirmation yet. Check My Orders later — it may still complete.')
        return
      }
      try {
        const res = await fetch(`/api/orders/${id}`)
        const json = await res.json()
        if (json.data?.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('paid')
          onPaid?.()
        } else if (json.data?.status === 'failed') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('failed')
          setError('The payment was declined or failed on your phone.')
        }
      } catch {
        // Transient network error — let the next poll tick try again.
      }
    }, POLL_INTERVAL_MS)
  }

  const startCheckout = async (method: 'PAYPACK' | 'STRIPE') => {
    if (!user) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          resourceId,
          buyerName: `${user.firstName} ${user.lastName}`.trim(),
          buyerEmail: user.email,
          buyerPhone: phone,
          type: action,
          method,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not start the payment request.')

      if (method === 'STRIPE' && json.data.checkoutUrl) {
        window.location.assign(json.data.checkoutUrl)
        return
      }
      setStage('pending')
      startPolling(json.data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the payment request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (pollTimer.current) clearInterval(pollTimer.current)
    setStage('form')
    setPhone('')
    setError('')
    onClose()
  }

  return (
    <Modal open onClose={handleClose} title={`${verb} "${bookTitle}"`} size="sm">
      <div className="text-center py-2">
        {stage === 'form' && (
          <>
            <p className="font-lato text-sm text-w-950 mb-4">
              {verb} <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span> for <span className="font-semibold">{priceRwf.toLocaleString()} RWF</span>
            </p>

            <div className="text-left mb-4">
              <label htmlFor="buy-phone" className="block font-lato text-xs font-semibold text-w-700 mb-1">Mobile Money Number</label>
              <div className="relative">
                <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-500" />
                <input
                  id="buy-phone" type="tel" inputMode="numeric" placeholder="078xxxxxxx" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 font-lato text-sm border border-w-400 rounded focus:border-w-600 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="font-lato text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <ElegantButton variant="primary" loading={submitting} onClick={() => startCheckout('PAYPACK')} disabled={!phone.trim()} className="w-full text-sm py-2">
                <Smartphone size={14} className="inline mr-1" /> Pay with Mobile Money
              </ElegantButton>
              <ElegantButton variant="outline" loading={submitting} onClick={() => startCheckout('STRIPE')} className="w-full text-sm py-2">
                <CreditCard size={14} className="inline mr-1" /> Pay with Card
              </ElegantButton>
            </div>
          </>
        )}

        {stage === 'pending' && (
          <>
            <Loader2 size={32} className="mx-auto text-w-600 mb-3 animate-spin" />
            <p className="font-lato text-sm text-w-950 mb-1">Check your phone</p>
            <p className="font-lato text-xs text-w-600 mb-4">
              Approve the mobile money prompt sent to {phone} to complete this {verb.toLowerCase()}.
            </p>
            <ElegantButton variant="outline" onClick={handleClose} className="w-full text-sm py-2">
              Close and check later
            </ElegantButton>
          </>
        )}

        {stage === 'paid' && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
            <p className="font-lato text-sm text-w-950 mb-1">Payment confirmed</p>
            <p className="font-lato text-xs text-w-600 mb-4">
              Your {verb.toLowerCase()} of <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span> is complete.
            </p>
            <ElegantButton variant="primary" onClick={handleClose} className="w-full text-sm py-2">
              Done
            </ElegantButton>
          </>
        )}

        {stage === 'failed' && (
          <>
            <XCircle size={32} className="mx-auto text-red-600 mb-3" />
            <p className="font-lato text-sm text-w-950 mb-1">Payment not completed</p>
            {error && <p className="font-lato text-xs text-w-600 mb-4">{error}</p>}
            <ElegantButton variant="outline" onClick={handleClose} className="w-full text-sm py-2">
              Close
            </ElegantButton>
          </>
        )}
      </div>
    </Modal>
  )
}
