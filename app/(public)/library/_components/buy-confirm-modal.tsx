'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, Smartphone, XCircle, Loader2 } from 'lucide-react'
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
}

type Stage = 'form' | 'pending' | 'paid' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 3 * 60_000

/**
 * Real PayPack purchase/rental flow — requests an actual mobile-money
 * charge (moves real RWF the moment "Confirm" is pressed; there is no
 * PayPack sandbox). After the request is sent, polls GET /api/orders/:id
 * every few seconds until the member approves/declines the prompt on
 * their phone, since payment confirmation is asynchronous and never
 * guaranteed by the initial request alone.
 */
export function BuyConfirmModal({ action, resourceId, bookTitle, priceRwf, onClose }: BuyConfirmModalProps) {
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState<Stage>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  if (!action) return null

  const verb = action === 'SALE' ? 'Buy' : 'Rent'

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

  const handleConfirm = async () => {
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
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not start the payment request.')
      setOrderId(json.data.id)
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
    setOrderId(null)
    onClose()
  }

  return (
    <Modal open onClose={handleClose} title={`${verb} "${bookTitle}"`} size="sm">
      <div className="text-center py-2">
        {stage === 'form' && (
          <>
            <p className="font-lato text-sm text-w-950 mb-1">
              {verb} <span className="font-semibold">&ldquo;{bookTitle}&rdquo;</span> for <span className="font-semibold">{priceRwf.toLocaleString()} RWF</span>
            </p>
            <p className="font-lato text-xs text-w-600 mb-4">
              Enter your MTN or Airtel mobile money number — you&apos;ll get a payment prompt on your phone to approve.
            </p>

            <div className="text-left mb-4">
              <label htmlFor="buy-phone" className="block font-lato text-xs font-semibold text-w-700 mb-1">Mobile Money Number</label>
              <div className="relative">
                <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-500" />
                <input
                  id="buy-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="078xxxxxxx"
                  value={phone}
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

            <ElegantButton variant="primary" loading={submitting} onClick={handleConfirm} disabled={!phone.trim()} className="w-full text-sm py-2">
              Send Payment Request
            </ElegantButton>
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
